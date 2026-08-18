"use server";

import {
  authError,
  AuthErrorCode,
  logAuthFailure,
} from "@/lib/auth-error-codes";
import { isOtpStateExpired } from "@/lib/biteonswitch/client";
import { completeWhatsAppLogin } from "@/lib/auth-otp-complete";
import { getAuthSupabaseClient } from "@/lib/auth-session";
import { codesMatch, getPlatformSettings, isFixedOtpUsable } from "@/lib/platform-settings";
import { normalizeWhatsAppNumber } from "@/lib/constants";

export type VerifyFixedOtpState =
  | { status: "success"; role: "TEACHER" | "STUDENT" }
  | { status: "needs_teacher_link" }
  | { status: "error"; code: AuthErrorCode };

export async function verifyFixedOtp(
  _prev: VerifyFixedOtpState | null,
  formData: FormData
): Promise<VerifyFixedOtpState> {
  try {
    if (!(await isFixedOtpUsable())) {
      return authError(AuthErrorCode.OTP_UNAVAILABLE);
    }

    const settings = await getPlatformSettings();
    const submitted = String(formData.get("otp_code") ?? "");
    if (!codesMatch(submitted, settings.fixedOtpCode)) {
      return authError(AuthErrorCode.OTP_INVALID);
    }

    const stateId = String(formData.get("state") ?? "").trim();
    if (!stateId) {
      return authError(AuthErrorCode.OTP_INVALID);
    }

    const supabase = getAuthSupabaseClient();
    if (!supabase) {
      return authError(AuthErrorCode.OTP_UNAVAILABLE);
    }

    const { data: stateRow, error: stateError } = await supabase
      .from("auth_otp_states")
      .select("id, created_at, consumed_at, whatsapp_hint, join_teacher_code")
      .eq("id", stateId)
      .maybeSingle();

    if (stateError) {
      logAuthFailure("FIXED_OTP_STATE_FETCH_FAILED", stateError);
      return authError(AuthErrorCode.OTP_UNAVAILABLE);
    }
    if (!stateRow) {
      return authError(AuthErrorCode.OTP_INVALID);
    }
    if (stateRow.consumed_at) {
      return authError(AuthErrorCode.OTP_REPLAY);
    }
    if (isOtpStateExpired(stateRow.created_at)) {
      return authError(AuthErrorCode.OTP_INVALID);
    }

    const rawWhatsapp = String(formData.get("whatsapp_number") ?? "");
    const fromForm = rawWhatsapp ? normalizeWhatsAppNumber(rawWhatsapp) : "";
    const fromHint = stateRow.whatsapp_hint
      ? normalizeWhatsAppNumber(stateRow.whatsapp_hint)
      : "";
    const whatsapp = fromForm || fromHint;
    if (whatsapp.length < 10 || whatsapp.length > 15) {
      return authError(AuthErrorCode.INVALID_WHATSAPP);
    }
    if (fromHint && fromForm && fromHint !== fromForm) {
      return authError(AuthErrorCode.OTP_INVALID);
    }

    const { data: consumed, error: consumeError } = await supabase
      .from("auth_otp_states")
      .update({
        consumed_at: new Date().toISOString(),
        provider_ref: "fixed-otp",
      })
      .eq("id", stateId)
      .is("consumed_at", null)
      .select("id")
      .maybeSingle();

    if (consumeError) {
      logAuthFailure("FIXED_OTP_STATE_CONSUME_FAILED", consumeError);
      return authError(AuthErrorCode.OTP_UNAVAILABLE);
    }
    if (!consumed) {
      return authError(AuthErrorCode.OTP_REPLAY);
    }

    const result = await completeWhatsAppLogin(
      whatsapp,
      stateRow.join_teacher_code
    );
    if (!result.ok) {
      if (result.reason === "account_inactive") {
        return authError(AuthErrorCode.ACCOUNT_INACTIVE);
      }
      if (result.reason === "register_required") {
        return authError(AuthErrorCode.REGISTER_REQUIRED);
      }
      if (result.reason === "needs_teacher_link") {
        return { status: "needs_teacher_link" };
      }
      return authError(AuthErrorCode.OTP_UNAVAILABLE);
    }

    return { status: "success", role: result.role };
  } catch (error) {
    logAuthFailure("FIXED_OTP_VERIFY_UNEXPECTED", error);
    return authError(AuthErrorCode.LOGIN_UNEXPECTED);
  }
}
