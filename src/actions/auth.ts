"use server";

import { getIronSession } from "iron-session";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import {
  authError,
  AuthErrorCode,
  logAuthFailure,
} from "@/lib/auth-error-codes";
import {
  isAdminWhatsAppAllowed,
  verifyAdminFallbackSecret,
} from "@/lib/admin-fallback";
import { assertCanEstablishSession } from "@/lib/account-access";
import { establishSession, getAuthSupabaseClient } from "@/lib/auth-session";
import { normalizeWhatsAppNumber } from "@/lib/constants";
import {
  defaultSession,
  sessionOptions,
  type SessionData,
} from "@/lib/session";
import { createAdminClient } from "@/lib/supabase/admin";
import type { LoginState } from "@/types/auth";

/**
 * FIX-AUTH-001: demo one-click login lives in `loginDemoAccount` (`src/actions/login.ts`)
 * and uses `resolveDemoLoginIdentity` + service-role admin client to upsert seed profiles.
 * UI-006: client logout forms call `startTopNavLoader()` before invoking this Server Action.
 */

export async function logout(): Promise<void> {
  const cookieStore = await cookies();
  const session = await getIronSession<SessionData>(cookieStore, sessionOptions);
  const previousRole = session.role;

  if (session.profileId) {
    const supabase = createAdminClient();
    await supabase
      .from("profiles")
      .update({ last_session_id: null })
      .eq("id", session.profileId);
  }

  Object.assign(session, defaultSession);
  await session.save();

  if (previousRole === "SUPER_ADMIN") {
    redirect("/admin/login");
  }
  redirect("/login");
}

/** AUTH-005: admin emergency login — WhatsApp + shared secret, allowlisted TEACHER. */
export async function loginAdminFallback(
  _prev: LoginState | null,
  formData: FormData
): Promise<LoginState> {
  try {
    return await loginAdminFallbackImpl(formData);
  } catch (error) {
    logAuthFailure("ADMIN_FALLBACK_UNEXPECTED", error);
    return authError(AuthErrorCode.ADMIN_FALLBACK_DENIED);
  }
}

async function loginAdminFallbackImpl(formData: FormData): Promise<LoginState> {
  const rawNumber = formData.get("whatsapp_number");
  const secret = (formData.get("admin_secret") as string) ?? "";

  if (!rawNumber || typeof rawNumber !== "string") {
    return authError(AuthErrorCode.ADMIN_FALLBACK_DENIED);
  }

  const whatsappNumber = normalizeWhatsAppNumber(rawNumber);

  if (!verifyAdminFallbackSecret(secret)) {
    logAuthFailure("ADMIN_FALLBACK_BAD_SECRET", { whatsappNumber });
    return authError(AuthErrorCode.ADMIN_FALLBACK_DENIED);
  }

  if (!isAdminWhatsAppAllowed(whatsappNumber)) {
    logAuthFailure("ADMIN_FALLBACK_NOT_ALLOWLISTED", { whatsappNumber });
    return authError(AuthErrorCode.ADMIN_FALLBACK_DENIED);
  }

  const supabase = getAuthSupabaseClient();
  if (!supabase) {
    return authError(AuthErrorCode.ADMIN_FALLBACK_DENIED);
  }

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("id, whatsapp_number, full_name, role")
    .eq("whatsapp_number", whatsappNumber)
    .eq("role", "TEACHER")
    .maybeSingle();

  if (error || !profile) {
    logAuthFailure("ADMIN_FALLBACK_PROFILE_MISS", error);
    return authError(AuthErrorCode.ADMIN_FALLBACK_DENIED);
  }

  const access = await assertCanEstablishSession(
    profile.id,
    profile.role,
    supabase
  );
  if (!access.ok) {
    return authError(AuthErrorCode.ACCOUNT_INACTIVE);
  }

  const sessionResult = await establishSession(profile, null, supabase);
  if ("status" in sessionResult && sessionResult.status === "error") {
    if (sessionResult.code === AuthErrorCode.ACCOUNT_INACTIVE) {
      return sessionResult;
    }
    return authError(AuthErrorCode.ADMIN_FALLBACK_DENIED);
  }

  return { status: "success", role: "TEACHER" };
}

/** [ADMIN-001] Email/password login for admin-provisioned teachers. */
export async function loginTeacherEmail(
  _prev: LoginState | null,
  formData: FormData
): Promise<LoginState> {
  const email = (formData.get("email") as string)?.trim() ?? "";
  const password = (formData.get("password") as string) ?? "";

  const { loginTeacherWithEmail } = await import("@/lib/admin/auth");
  const result = await loginTeacherWithEmail(email, password);

  if (result === "inactive") {
    return authError(AuthErrorCode.ACCOUNT_INACTIVE);
  }
  if (!result) {
    return authError(AuthErrorCode.ADMIN_FALLBACK_DENIED);
  }

  const sessionResult = await establishSession(result, null);
  if ("status" in sessionResult && sessionResult.status === "error") {
    if (sessionResult.code === AuthErrorCode.ACCOUNT_INACTIVE) {
      return sessionResult;
    }
    return authError(AuthErrorCode.ADMIN_FALLBACK_DENIED);
  }

  return { status: "success", role: "TEACHER" };
}
