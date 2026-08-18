import { NextRequest, NextResponse } from "next/server";
import {
  isOtpStateExpired,
  verifyCallbackToken,
  whatsappFromBiteonToken,
} from "@/lib/biteonswitch/client";
import { getAuthSupabaseClient } from "@/lib/auth-session";
import { logAuthFailure } from "@/lib/auth-error-codes";
import {
  completeWhatsAppLogin,
  completeWhatsAppLoginRedirect,
} from "@/lib/auth-otp-complete";

function loginErrorRedirect(request: NextRequest, error: string) {
  const url = new URL("/login", request.url);
  url.searchParams.set("error", error);
  url.searchParams.set("tab", "login");
  return NextResponse.redirect(url);
}

/**
 * Biteon hosted return.
 * - Zero-code / hash handoff: `?token=` JWT only (phone claim) — no otp state.
 * - Legacy: `?token=&state=` with auth_otp_states row.
 */
export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get("token");
  const state = request.nextUrl.searchParams.get("state");

  if (!token) {
    return loginErrorRedirect(request, "otp_invalid");
  }

  if (!state) {
    const phone = whatsappFromBiteonToken(token);
    if (!phone) {
      return loginErrorRedirect(request, "otp_invalid");
    }
    const result = await completeWhatsAppLogin(phone);
    return completeWhatsAppLoginRedirect(request.url, result);
  }

  const supabase = getAuthSupabaseClient();
  if (!supabase) {
    return loginErrorRedirect(request, "otp_unavailable");
  }

  const { data: stateRow, error: stateError } = await supabase
    .from("auth_otp_states")
    .select("id, created_at, consumed_at, whatsapp_hint, join_teacher_code")
    .eq("id", state)
    .maybeSingle();

  if (stateError) {
    logAuthFailure("OTP_STATE_FETCH_FAILED", stateError);
    return loginErrorRedirect(request, "otp_unavailable");
  }

  if (!stateRow) {
    return loginErrorRedirect(request, "otp_invalid");
  }

  if (stateRow.consumed_at) {
    return loginErrorRedirect(request, "otp_replay");
  }

  if (isOtpStateExpired(stateRow.created_at)) {
    return loginErrorRedirect(request, "otp_invalid");
  }

  const verified = await verifyCallbackToken({ token, state });
  if (!verified.ok) {
    const fromJwt = whatsappFromBiteonToken(token);
    if (fromJwt) {
      const { data: consumed } = await supabase
        .from("auth_otp_states")
        .update({
          consumed_at: new Date().toISOString(),
          provider_ref: `jwt:${state}`,
        })
        .eq("id", state)
        .is("consumed_at", null)
        .select("id")
        .maybeSingle();
      if (!consumed) {
        return loginErrorRedirect(request, "otp_replay");
      }
      const result = await completeWhatsAppLogin(
        fromJwt,
        stateRow.join_teacher_code
      );
      return completeWhatsAppLoginRedirect(request.url, result);
    }
    return loginErrorRedirect(
      request,
      verified.reason === "unavailable" ? "otp_unavailable" : "otp_invalid"
    );
  }

  const { data: consumed, error: consumeError } = await supabase
    .from("auth_otp_states")
    .update({
      consumed_at: new Date().toISOString(),
      provider_ref: verified.providerRef ?? null,
    })
    .eq("id", state)
    .is("consumed_at", null)
    .select("id")
    .maybeSingle();

  if (consumeError) {
    logAuthFailure("OTP_STATE_CONSUME_FAILED", consumeError);
    return loginErrorRedirect(request, "otp_unavailable");
  }

  if (!consumed) {
    return loginErrorRedirect(request, "otp_replay");
  }

  const result = await completeWhatsAppLogin(
    verified.whatsappNumber,
    stateRow.join_teacher_code
  );
  return completeWhatsAppLoginRedirect(request.url, result);
}
