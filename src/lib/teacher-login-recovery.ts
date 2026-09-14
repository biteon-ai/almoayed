import { createHash, randomBytes } from "node:crypto";
import { AuthErrorCode } from "@/lib/auth-error-codes";
import { getAppUrl } from "@/lib/app-origin";
import { isValidEmail } from "@/lib/admin/passwords";
import { sendEmail } from "@/lib/resend";
import { TEACHER_LOGIN_MESSAGES } from "@/lib/teacher-login-messages";
import type { AuthSupabaseClient } from "@/lib/auth-session";
import type {
  TeacherAccountStatus,
  TeacherLoginToken,
  TeacherLoginTokenPurpose,
} from "@/types/database";

export type RecoveryPurpose = TeacherLoginTokenPurpose;

export const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000;
export const RATE_LIMIT_MAX = 3;
export const MIN_PASSWORD_LENGTH = 8;

export type TeacherLookup =
  | { status: "not_found" }
  | { status: "inactive"; profileId: string }
  | {
      status: "ok";
      profileId: string;
      email: string;
      fullName: string;
      whatsappNumber: string | null;
    };

export type RecoveryResult =
  | { status: "success" }
  | { status: "error"; code: AuthErrorCode };

type RecoveryClient = Pick<AuthSupabaseClient, "from">;

type TeacherRow = {
  id: string;
  email: string | null;
  full_name: string;
  role: string;
  teacher_account_status: TeacherAccountStatus;
  whatsapp_number: string | null;
};

export function hashRecoverySecret(secret: string): string {
  return createHash("sha256").update(secret, "utf8").digest("hex");
}

export function generateRecoverySecret(): string {
  return randomBytes(32).toString("hex");
}

export function resetExpiresAt(now = new Date()): Date {
  return new Date(now.getTime() + 60 * 60 * 1000);
}

export function magicExpiresAt(now = new Date()): Date {
  return new Date(now.getTime() + 15 * 60 * 1000);
}

export function isRateLimited(count: number): boolean {
  return count >= RATE_LIMIT_MAX;
}

export function buildResetUrl(origin: string, secret: string): string {
  return `${origin.replace(/\/+$/, "")}/teacher/reset?token=${encodeURIComponent(secret)}`;
}

export function buildMagicUrl(origin: string, secret: string): string {
  return `${origin.replace(/\/+$/, "")}/teacher/magic?token=${encodeURIComponent(secret)}`;
}

export function resetEmailHtml(fullName: string, url: string): string {
  const name = fullName.trim() || "أستاذ";
  return `<p>مرحباً ${escapeHtml(name)}،</p><p>اضغط الرابط التالي لتعيين كلمة مرور جديدة (صالح لمدة 60 دقيقة، لمرة واحدة):</p><p><a href="${escapeHtml(url)}">${escapeHtml(url)}</a></p>`;
}

export function magicEmailHtml(fullName: string, url: string): string {
  const name = fullName.trim() || "أستاذ";
  return `<p>مرحباً ${escapeHtml(name)}،</p><p>اضغط الرابط التالي للدخول دون كلمة مرور (صالح لمدة 15 دقيقة، لمرة واحدة):</p><p><a href="${escapeHtml(url)}">${escapeHtml(url)}</a></p>`;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export async function lookupTeacherByEmail(
  rawEmail: string,
  supabase: RecoveryClient
): Promise<TeacherLookup> {
  const email = rawEmail.trim().toLowerCase();
  if (!isValidEmail(email)) return { status: "not_found" };

  const { data, error } = await supabase
    .from("profiles")
    .select("id, email, full_name, role, teacher_account_status, whatsapp_number")
    .eq("email", email)
    .eq("role", "TEACHER")
    .maybeSingle<TeacherRow>();

  if (error || !data) return { status: "not_found" };
  if (data.teacher_account_status === "inactive") {
    return { status: "inactive", profileId: data.id };
  }

  return {
    status: "ok",
    profileId: data.id,
    email: data.email ?? email,
    fullName: data.full_name,
    whatsappNumber: data.whatsapp_number,
  };
}

export async function countRecentTokens(
  profileId: string,
  since: Date,
  supabase: RecoveryClient
): Promise<number> {
  const { count, error } = await supabase
    .from("teacher_login_tokens")
    .select("id", { count: "exact", head: true })
    .eq("profile_id", profileId)
    .gt("created_at", since.toISOString());

  if (error) return RATE_LIMIT_MAX;
  return count ?? 0;
}

export async function issueAndSendRecovery(
  rawEmail: string,
  purpose: RecoveryPurpose,
  supabase: RecoveryClient,
  send: typeof sendEmail = sendEmail,
  origin: string = getAppUrl()
): Promise<RecoveryResult> {
  const trimmed = rawEmail.trim().toLowerCase();
  if (!isValidEmail(trimmed)) {
    return { status: "error", code: AuthErrorCode.INVALID_EMAIL };
  }

  const lookup = await lookupTeacherByEmail(trimmed, supabase);
  if (lookup.status === "not_found") {
    return { status: "error", code: AuthErrorCode.TEACHER_NOT_FOUND };
  }
  if (lookup.status === "inactive") {
    return { status: "error", code: AuthErrorCode.ACCOUNT_INACTIVE };
  }

  const since = new Date(Date.now() - RATE_LIMIT_WINDOW_MS);
  const recent = await countRecentTokens(lookup.profileId, since, supabase);
  if (isRateLimited(recent)) {
    return { status: "error", code: AuthErrorCode.RECOVERY_RATE_LIMITED };
  }

  const secret = generateRecoverySecret();
  const expires =
    purpose === "password_reset" ? resetExpiresAt() : magicExpiresAt();

  const { data: inserted, error: insertError } = await supabase
    .from("teacher_login_tokens")
    .insert({
      profile_id: lookup.profileId,
      purpose,
      token_hash: hashRecoverySecret(secret),
      expires_at: expires.toISOString(),
    })
    .select("id")
    .maybeSingle<{ id: string }>();

  if (insertError || !inserted?.id) {
    return { status: "error", code: AuthErrorCode.MAIL_SEND_FAILED };
  }

  const url =
    purpose === "password_reset"
      ? buildResetUrl(origin, secret)
      : buildMagicUrl(origin, secret);
  const html =
    purpose === "password_reset"
      ? resetEmailHtml(lookup.fullName, url)
      : magicEmailHtml(lookup.fullName, url);
  const subject =
    purpose === "password_reset"
      ? TEACHER_LOGIN_MESSAGES.resetSubject
      : TEACHER_LOGIN_MESSAGES.magicSubject;

  const mailed = await send({
    to: lookup.email,
    subject,
    html,
  });

  if (!mailed.ok) {
    await supabase.from("teacher_login_tokens").delete().eq("id", inserted.id);
    return { status: "error", code: AuthErrorCode.MAIL_SEND_FAILED };
  }

  return { status: "success" };
}

export async function loadValidToken(
  secret: string,
  purpose: RecoveryPurpose,
  supabase: RecoveryClient
): Promise<{ token: TeacherLoginToken; profile: TeacherRow } | null> {
  const trimmed = secret.trim();
  if (!trimmed) return null;

  const { data: token, error } = await supabase
    .from("teacher_login_tokens")
    .select("id, profile_id, purpose, token_hash, expires_at, consumed_at, created_at")
    .eq("token_hash", hashRecoverySecret(trimmed))
    .eq("purpose", purpose)
    .maybeSingle<TeacherLoginToken>();

  if (error || !token) return null;
  if (token.consumed_at) return null;
  if (new Date(token.expires_at).getTime() <= Date.now()) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, email, full_name, role, teacher_account_status, whatsapp_number")
    .eq("id", token.profile_id)
    .maybeSingle<TeacherRow>();

  if (!profile || profile.role !== "TEACHER") return null;
  return { token, profile };
}

export async function consumeTokenRow(
  tokenId: string,
  supabase: RecoveryClient
): Promise<boolean> {
  const { data } = await supabase
    .from("teacher_login_tokens")
    .update({ consumed_at: new Date().toISOString() })
    .eq("id", tokenId)
    .is("consumed_at", null)
    .select("id")
    .maybeSingle<{ id: string }>();
  return Boolean(data?.id);
}

export function validateNewPassword(
  password: string,
  confirm: string
): AuthErrorCode | null {
  if (password.length < MIN_PASSWORD_LENGTH) {
    return AuthErrorCode.PASSWORD_TOO_SHORT;
  }
  if (password !== confirm) return AuthErrorCode.PASSWORD_MISMATCH;
  return null;
}
