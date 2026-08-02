import { NextRequest, NextResponse } from "next/server";
import {
  isOtpStateExpired,
  roleHomePath,
  verifyCallbackToken,
  whatsappFromBiteonToken,
} from "@/lib/biteonswitch/client";
import {
  establishSession,
  getAuthSupabaseClient,
  savePendingTeacherLinkSession,
} from "@/lib/auth-session";
import { AuthErrorCode, logAuthFailure } from "@/lib/auth-error-codes";
import { assertCanEstablishSession } from "@/lib/account-access";
import type { Profile } from "@/types/database";

function loginErrorRedirect(request: NextRequest, error: string) {
  const url = new URL("/login", request.url);
  url.searchParams.set("error", error);
  url.searchParams.set("tab", "login");
  return NextResponse.redirect(url);
}

async function finishLogin(
  request: NextRequest,
  whatsappNumber: string
) {
  const supabase = getAuthSupabaseClient();
  if (!supabase) {
    return loginErrorRedirect(request, "otp_unavailable");
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("*")
    .eq("whatsapp_number", whatsappNumber)
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
    const { data: links, error: linksError } = await supabase
      .from("student_teachers")
      .select("teacher_id, status, created_at")
      .eq("student_id", profile.id)
      .order("created_at", { ascending: true });

    if (linksError) {
      logAuthFailure("OTP_LINKS_FETCH_FAILED", linksError);
      return loginErrorRedirect(request, "otp_unavailable");
    }

    if (!links || links.length === 0) {
      // AUTH-002: limited pending-teacher session — not AUTH-007 inactive.
      const pending = await savePendingTeacherLinkSession(profile);
      if ("status" in pending && pending.status === "error") {
        return loginErrorRedirect(request, "otp_unavailable");
      }
      const url = new URL("/login", request.url);
      url.searchParams.set("tab", "login");
      url.searchParams.set("needs_teacher", "1");
      return NextResponse.redirect(url);
    }

    const access = await assertCanEstablishSession(
      profile.id,
      profile.role,
      supabase
    );
    if (!access.ok) {
      return loginErrorRedirect(request, "account_inactive");
    }

    const active = links.find((l) => l.status === "active");
    teacherId =
      access.teacherId ?? active?.teacher_id ?? links[0]?.teacher_id ?? null;
  } else if (profile.role === "TEACHER") {
    const access = await assertCanEstablishSession(
      profile.id,
      profile.role,
      supabase
    );
    if (!access.ok) {
      return loginErrorRedirect(request, "account_inactive");
    }
  }

  const sessionResult = await establishSession(profile, teacherId, supabase);
  if ("status" in sessionResult && sessionResult.status === "error") {
    if (sessionResult.code === AuthErrorCode.ACCOUNT_INACTIVE) {
      return loginErrorRedirect(request, "account_inactive");
    }
    return loginErrorRedirect(request, "otp_unavailable");
  }

  const { role } = sessionResult as { role: "TEACHER" | "STUDENT" };
  return NextResponse.redirect(new URL(roleHomePath(role), request.url));
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

  // Hosted Login return: JWT in query (forwarded from #access_token on /login).
  if (!state) {
    const phone = whatsappFromBiteonToken(token);
    if (!phone) {
      return loginErrorRedirect(request, "otp_invalid");
    }
    return finishLogin(request, phone);
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
    // Prefer JWT phone if legacy verify API is not configured.
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
      return finishLogin(request, fromJwt);
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

  return finishLogin(request, verified.whatsappNumber);
}
