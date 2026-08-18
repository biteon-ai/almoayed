import { NextResponse } from "next/server";
import { roleHomePath } from "@/lib/biteonswitch/client";
import {
  establishSession,
  getAuthSupabaseClient,
  savePendingTeacherLinkSession,
} from "@/lib/auth-session";
import { AuthErrorCode, logAuthFailure } from "@/lib/auth-error-codes";
import { assertCanEstablishSession } from "@/lib/account-access";
import { resolveTeacherForJoinCode } from "@/lib/trial-join-server";
import { upsertActiveStudentTeacherLink } from "@/lib/trial-join-link";
import { isJoinTeacherActive } from "@/lib/trial-join";
import type { Profile } from "@/types/database";

export type CompleteWhatsAppLoginResult =
  | { ok: true; role: "TEACHER" | "STUDENT" }
  | {
      ok: false;
      reason:
        | "otp_unavailable"
        | "register_required"
        | "account_inactive"
        | "needs_teacher_link";
    };

/**
 * Shared WhatsApp session completion for BiteonSwitch callback and Fixed OTP.
 * AUTH-007 / AUTH-003 / AUTH-008 join-code linking stay in one place.
 */
export async function completeWhatsAppLogin(
  whatsappNumber: string,
  joinTeacherCode?: string | null
): Promise<CompleteWhatsAppLoginResult> {
  const supabase = getAuthSupabaseClient();
  if (!supabase) {
    return { ok: false, reason: "otp_unavailable" };
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("*")
    .eq("whatsapp_number", whatsappNumber)
    .maybeSingle<Profile>();

  if (profileError) {
    logAuthFailure("OTP_PROFILE_FETCH_FAILED", profileError);
    return { ok: false, reason: "otp_unavailable" };
  }

  if (!profile) {
    return { ok: false, reason: "register_required" };
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
      return { ok: false, reason: "otp_unavailable" };
    }

    if (!links || links.length === 0) {
      if (joinTeacherCode) {
        const referring = await resolveTeacherForJoinCode(
          joinTeacherCode,
          supabase
        );
        if (referring && isJoinTeacherActive(referring)) {
          const linkResult = await upsertActiveStudentTeacherLink(
            supabase,
            profile.id,
            referring.id,
            { preserveProTier: true }
          );
          if (linkResult.ok) {
            teacherId = referring.id;
          }
        }
      }

      if (!teacherId) {
        const pending = await savePendingTeacherLinkSession(profile);
        if ("status" in pending && pending.status === "error") {
          return { ok: false, reason: "otp_unavailable" };
        }
        return { ok: false, reason: "needs_teacher_link" };
      }
    } else {
      const access = await assertCanEstablishSession(
        profile.id,
        profile.role,
        supabase
      );
      if (!access.ok) {
        return { ok: false, reason: "account_inactive" };
      }

      const active = links.find((l) => l.status === "active");
      let referringTeacherId: string | null =
        access.teacherId ?? active?.teacher_id ?? links[0]?.teacher_id ?? null;

      if (joinTeacherCode) {
        const referring = await resolveTeacherForJoinCode(
          joinTeacherCode,
          supabase
        );
        if (referring && isJoinTeacherActive(referring)) {
          const linkResult = await upsertActiveStudentTeacherLink(
            supabase,
            profile.id,
            referring.id,
            { preserveProTier: true }
          );
          if (linkResult.ok) {
            referringTeacherId = referring.id;
          }
        }
      }

      teacherId = referringTeacherId;
    }

    if (teacherId) {
      const access = await assertCanEstablishSession(
        profile.id,
        profile.role,
        supabase
      );
      if (!access.ok) {
        return { ok: false, reason: "account_inactive" };
      }
    }
  } else if (profile.role === "TEACHER") {
    const access = await assertCanEstablishSession(
      profile.id,
      profile.role,
      supabase
    );
    if (!access.ok) {
      return { ok: false, reason: "account_inactive" };
    }
  }

  const sessionResult = await establishSession(profile, teacherId, supabase);
  if ("status" in sessionResult && sessionResult.status === "error") {
    if (sessionResult.code === AuthErrorCode.ACCOUNT_INACTIVE) {
      return { ok: false, reason: "account_inactive" };
    }
    return { ok: false, reason: "otp_unavailable" };
  }

  const { role } = sessionResult as { role: "TEACHER" | "STUDENT" };
  return { ok: true, role };
}

export function completeWhatsAppLoginRedirect(
  requestUrl: string,
  result: CompleteWhatsAppLoginResult
): NextResponse {
  const login = new URL("/login", requestUrl);
  login.searchParams.set("tab", "login");
  if (!result.ok) {
    if (result.reason === "needs_teacher_link") {
      const url = new URL("/login", requestUrl);
      url.searchParams.set("tab", "login");
      url.searchParams.set("needs_teacher", "1");
      return NextResponse.redirect(url);
    }
    login.searchParams.set("error", result.reason);
    return NextResponse.redirect(login);
  }
  return NextResponse.redirect(new URL(roleHomePath(result.role), requestUrl));
}
