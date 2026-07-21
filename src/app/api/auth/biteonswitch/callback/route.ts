import { NextRequest, NextResponse } from "next/server";
import {
  isOtpStateExpired,
  roleHomePath,
  verifyCallbackToken,
} from "@/lib/biteonswitch/client";
import {
  establishSession,
  getAuthSupabaseClient,
} from "@/lib/auth-session";
import { logAuthFailure } from "@/lib/auth-error-codes";
import type { Profile } from "@/types/database";

function loginErrorRedirect(request: NextRequest, error: string) {
  const url = new URL("/login", request.url);
  url.searchParams.set("error", error);
  return NextResponse.redirect(url);
}

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get("token");
  const state = request.nextUrl.searchParams.get("state");

  if (!token || !state) {
    return loginErrorRedirect(request, "otp_invalid");
  }

  const supabase = getAuthSupabaseClient();
  if (!supabase) {
    return loginErrorRedirect(request, "otp_unavailable");
  }

  const { data: stateRow, error: stateError } = await supabase
    .from("auth_otp_states")
    .select("id, created_at, consumed_at, whatsapp_hint")
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

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("*")
    .eq("whatsapp_number", verified.whatsappNumber)
    .maybeSingle<Profile>();

  if (profileError) {
    logAuthFailure("OTP_PROFILE_FETCH_FAILED", profileError);
    return loginErrorRedirect(request, "otp_unavailable");
  }

  if (!profile) {
    return loginErrorRedirect(request, "register_required");
  }

  let teacherId: string | null = null;
  if (profile.role === "STUDENT") {
    const { data: activeLink } = await supabase
      .from("student_teachers")
      .select("teacher_id")
      .eq("student_id", profile.id)
      .eq("status", "active")
      .order("created_at", { ascending: true })
      .limit(1)
      .maybeSingle();

    teacherId = activeLink?.teacher_id ?? null;

    if (!teacherId) {
      const { data: anyLink } = await supabase
        .from("student_teachers")
        .select("teacher_id")
        .eq("student_id", profile.id)
        .order("created_at", { ascending: true })
        .limit(1)
        .maybeSingle();
      teacherId = anyLink?.teacher_id ?? null;
    }
  }

  const sessionResult = await establishSession(profile, teacherId);
  if ("status" in sessionResult && sessionResult.status === "error") {
    return loginErrorRedirect(request, "otp_unavailable");
  }

  const { role } = sessionResult as { role: "TEACHER" | "STUDENT" };
  return NextResponse.redirect(new URL(roleHomePath(role), request.url));
}
