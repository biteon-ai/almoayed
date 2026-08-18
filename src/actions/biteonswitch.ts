"use server";

import { redirect } from "next/navigation";
import {
  authError,
  AuthErrorCode,
  logAuthFailure,
} from "@/lib/auth-error-codes";
import {
  buildHostedLoginUrl,
} from "@/lib/biteonswitch/client";
import {
  getBiteonSwitchConfig,
  isBiteonSwitchConfigured,
} from "@/lib/biteonswitch/config";
import { getAuthSupabaseClient } from "@/lib/auth-session";
import { normalizeWhatsAppNumber } from "@/lib/constants";

export type StartOtpState =
  | { status: "redirect"; redirectUrl: string }
  | { status: "error"; code: typeof AuthErrorCode.OTP_UNAVAILABLE | typeof AuthErrorCode.MISSING_WHATSAPP | typeof AuthErrorCode.INVALID_WHATSAPP | typeof AuthErrorCode.LOGIN_UNEXPECTED };

/** AUTH-001: create otp state and return hosted BiteonSwitch URL (mock or live). */
export async function startBiteonSwitchOtp(
  _prev: StartOtpState | null,
  formData: FormData
): Promise<StartOtpState> {
  try {
    const config = getBiteonSwitchConfig();
    if (!isBiteonSwitchConfigured(config)) {
      return authError(AuthErrorCode.OTP_UNAVAILABLE) as StartOtpState;
    }

    const rawNumber = formData.get("whatsapp_number");
    let whatsappHint: string | undefined;

    if (typeof rawNumber === "string" && rawNumber.trim()) {
      whatsappHint = normalizeWhatsAppNumber(rawNumber);
      if (whatsappHint.length < 10 || whatsappHint.length > 15) {
        return authError(AuthErrorCode.INVALID_WHATSAPP) as StartOtpState;
      }
    }

    // Mock mode requires a WhatsApp hint to complete the bounce callback
    if (config.mock && !whatsappHint) {
      return authError(AuthErrorCode.MISSING_WHATSAPP) as StartOtpState;
    }

    const supabase = getAuthSupabaseClient();
    if (!supabase) {
      return authError(AuthErrorCode.OTP_UNAVAILABLE) as StartOtpState;
    }

    const joinTeacherCodeRaw = formData.get("join_teacher_code");
    const joinTeacherCode =
      typeof joinTeacherCodeRaw === "string" && joinTeacherCodeRaw.trim()
        ? joinTeacherCodeRaw.trim()
        : null;

    const { data: stateRow, error: insertError } = await supabase
      .from("auth_otp_states")
      .insert({
        whatsapp_hint: whatsappHint ?? null,
        join_teacher_code: joinTeacherCode,
      })
      .select("id")
      .single();

    if (insertError || !stateRow) {
      logAuthFailure("OTP_STATE_INSERT_FAILED", insertError);
      return authError(AuthErrorCode.OTP_UNAVAILABLE) as StartOtpState;
    }

    const redirectUrl = buildHostedLoginUrl({
      state: stateRow.id,
      whatsappHint,
    });

    if (!redirectUrl) {
      return authError(AuthErrorCode.OTP_UNAVAILABLE) as StartOtpState;
    }

    return { status: "redirect", redirectUrl };
  } catch (error) {
    logAuthFailure("START_OTP_UNEXPECTED", error);
    return authError(AuthErrorCode.LOGIN_UNEXPECTED) as StartOtpState;
  }
}

/** Convenience: start OTP and redirect immediately (form action). */
export async function startBiteonSwitchOtpAndRedirect(
  formData: FormData
): Promise<void> {
  const result = await startBiteonSwitchOtp(null, formData);
  if (result.status === "redirect") {
    redirect(result.redirectUrl);
  }
  const code =
    result.status === "error" ? result.code : AuthErrorCode.OTP_UNAVAILABLE;
  redirect(`/login?error=${encodeURIComponent(mapOtpErrorToQuery(code))}`);
}

function mapOtpErrorToQuery(code: string): string {
  switch (code) {
    case AuthErrorCode.OTP_UNAVAILABLE:
      return "otp_unavailable";
    case AuthErrorCode.MISSING_WHATSAPP:
    case AuthErrorCode.INVALID_WHATSAPP:
      return "otp_invalid";
    default:
      return "otp_unavailable";
  }
}
