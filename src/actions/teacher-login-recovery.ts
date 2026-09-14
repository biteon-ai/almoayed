"use server";

import { authError, AuthErrorCode } from "@/lib/auth-error-codes";
import { hashPassword } from "@/lib/admin/passwords";
import { assertCanEstablishSession } from "@/lib/account-access";
import { establishSession, getAuthSupabaseClient } from "@/lib/auth-session";
import {
  consumeTokenRow,
  issueAndSendRecovery,
  loadValidToken,
  validateNewPassword,
} from "@/lib/teacher-login-recovery";

export type RecoveryRequestState =
  | { status: "success" }
  | { status: "error"; code: AuthErrorCode };

export async function requestTeacherPasswordReset(
  email: string
): Promise<RecoveryRequestState> {
  const supabase = getAuthSupabaseClient();
  if (!supabase) return authError(AuthErrorCode.SUPABASE_ENV_MISSING);
  return issueAndSendRecovery(email, "password_reset", supabase);
}

export async function requestTeacherMagicLink(
  email: string
): Promise<RecoveryRequestState> {
  const supabase = getAuthSupabaseClient();
  if (!supabase) return authError(AuthErrorCode.SUPABASE_ENV_MISSING);
  return issueAndSendRecovery(email, "magic_link", supabase);
}

export async function peekTeacherResetToken(
  token: string
): Promise<RecoveryRequestState> {
  const supabase = getAuthSupabaseClient();
  if (!supabase) return authError(AuthErrorCode.RESET_INVALID);
  const loaded = await loadValidToken(token, "password_reset", supabase);
  if (!loaded) return authError(AuthErrorCode.RESET_INVALID);
  if (loaded.profile.teacher_account_status === "inactive") {
    return authError(AuthErrorCode.ACCOUNT_INACTIVE);
  }
  return { status: "success" };
}

export async function completeTeacherPasswordReset(input: {
  token: string;
  password: string;
  confirm: string;
}): Promise<RecoveryRequestState> {
  const passwordError = validateNewPassword(input.password, input.confirm);
  if (passwordError) return authError(passwordError);

  const supabase = getAuthSupabaseClient();
  if (!supabase) return authError(AuthErrorCode.SUPABASE_ENV_MISSING);

  const loaded = await loadValidToken(input.token, "password_reset", supabase);
  if (!loaded) return authError(AuthErrorCode.RESET_INVALID);
  if (loaded.profile.teacher_account_status === "inactive") {
    return authError(AuthErrorCode.ACCOUNT_INACTIVE);
  }

  const passwordHash = await hashPassword(input.password);
  const { error: updateError } = await supabase
    .from("profiles")
    .update({ password_hash: passwordHash })
    .eq("id", loaded.profile.id);

  if (updateError) return authError(AuthErrorCode.LOGIN_UNEXPECTED);

  const consumed = await consumeTokenRow(loaded.token.id, supabase);
  if (!consumed) return authError(AuthErrorCode.RESET_INVALID);

  return { status: "success" };
}

export async function consumeTeacherMagicLink(
  token: string
): Promise<RecoveryRequestState & { role?: "TEACHER" }> {
  const supabase = getAuthSupabaseClient();
  if (!supabase) return authError(AuthErrorCode.SUPABASE_ENV_MISSING);

  const loaded = await loadValidToken(token, "magic_link", supabase);
  if (!loaded) return authError(AuthErrorCode.MAGIC_INVALID);

  const consumed = await consumeTokenRow(loaded.token.id, supabase);
  if (!consumed) return authError(AuthErrorCode.MAGIC_INVALID);

  const access = await assertCanEstablishSession(
    loaded.profile.id,
    "TEACHER",
    supabase
  );
  if (!access.ok) return authError(AuthErrorCode.ACCOUNT_INACTIVE);

  const sessionResult = await establishSession(
    {
      id: loaded.profile.id,
      whatsapp_number: loaded.profile.whatsapp_number,
      full_name: loaded.profile.full_name,
      role: "TEACHER",
    },
    null,
    supabase
  );

  if ("status" in sessionResult && sessionResult.status === "error") {
    return sessionResult;
  }

  return { status: "success", role: "TEACHER" };
}
