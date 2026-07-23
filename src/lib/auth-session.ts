import { getIronSession } from "iron-session";
import { cookies } from "next/headers";
import {
  authError,
  AuthErrorCode,
  logAuthFailure,
} from "@/lib/auth-error-codes";
import { generateSessionToken } from "@/lib/session-token";
import { sessionOptions, type SessionData } from "@/lib/session";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Profile } from "@/types/database";
import type { LoginState } from "@/types/auth";

export function getAuthSupabaseClient() {
  try {
    return createAdminClient();
  } catch (error) {
    logAuthFailure("SUPABASE_ENV_MISSING", error);
    return null;
  }
}

/**
 * Mint iron-session and update profiles.last_session_id (AUTH-003).
 * Shared by OTP callback, admin fallback, and demo bypass.
 */
export async function establishSession(
  profile: Profile,
  teacherId: string | null
): Promise<LoginState | { role: "TEACHER" | "STUDENT" | "SUPER_ADMIN" }> {
  const supabase = getAuthSupabaseClient();
  if (!supabase) {
    return authError(AuthErrorCode.SUPABASE_ENV_MISSING);
  }

  const sessionToken = generateSessionToken();

  const { error: sessionUpdateError } = await supabase
    .from("profiles")
    .update({ last_session_id: sessionToken })
    .eq("id", profile.id);

  if (sessionUpdateError) {
    logAuthFailure("SUPABASE_SESSION_UPDATE_FAILED", sessionUpdateError);
    return authError(AuthErrorCode.SUPABASE_SESSION_UPDATE_FAILED);
  }

  try {
    const cookieStore = await cookies();
    const session = await getIronSession<SessionData>(
      cookieStore,
      sessionOptions
    );

    session.profileId = profile.id;
    session.whatsappNumber = profile.whatsapp_number ?? "";
    session.impersonation = undefined;
    session.fullName = profile.full_name;
    session.role = profile.role;
    session.isLoggedIn = true;
    session.sessionToken = sessionToken;
    session.currentTeacherId = teacherId;
    session.pendingTeacherLink = false;

    await session.save();
  } catch (error) {
    logAuthFailure("SESSION_SAVE_FAILED", error);
    return authError(AuthErrorCode.SESSION_SAVE_FAILED);
  }

  return { role: profile.role };
}

/**
 * OTP succeeded but student has no teacher link — hold identity until رمز الأستاذ.
 * Does NOT set isLoggedIn or last_session_id.
 */
export async function savePendingTeacherLinkSession(
  profile: Profile
): Promise<{ ok: true } | LoginState> {
  try {
    const cookieStore = await cookies();
    const session = await getIronSession<SessionData>(
      cookieStore,
      sessionOptions
    );

    session.profileId = profile.id;
    session.whatsappNumber = profile.whatsapp_number ?? "";
    session.impersonation = undefined;
    session.fullName = profile.full_name;
    session.role = profile.role;
    session.isLoggedIn = false;
    session.sessionToken = "";
    session.currentTeacherId = null;
    session.pendingTeacherLink = true;

    await session.save();
    return { ok: true };
  } catch (error) {
    logAuthFailure("PENDING_LINK_SESSION_FAILED", error);
    return authError(AuthErrorCode.SESSION_SAVE_FAILED);
  }
}

export async function getPendingTeacherLinkSession(): Promise<{
  profileId: string;
  whatsappNumber: string;
  fullName: string;
} | null> {
  const cookieStore = await cookies();
  const session = await getIronSession<SessionData>(cookieStore, sessionOptions);
  if (!session.pendingTeacherLink || !session.profileId) return null;
  return {
    profileId: session.profileId,
    whatsappNumber: session.whatsappNumber,
    fullName: session.fullName,
  };
}
