import { getIronSession } from "iron-session";
import { cookies } from "next/headers";
import {
  authError,
  AuthErrorCode,
  logAuthFailure,
} from "@/lib/auth-error-codes";
import { generateSessionToken } from "@/lib/session-token";
import { sessionOptions, type SessionData } from "@/lib/session";
import {
  createAdminClient,
  isPlaceholderSupabaseUrl,
} from "@/lib/supabase/admin";
import type { Profile } from "@/types/database";
import type { LoginState } from "@/types/auth";

/** Minimal profile fields required to mint a session (AUTH-003 / AUTH-006). */
export type SessionProfile = Pick<
  Profile,
  "id" | "whatsapp_number" | "full_name" | "role"
>;

export type AuthSupabaseClient = ReturnType<typeof createAdminClient>;

export function getAuthSupabaseClient(): AuthSupabaseClient | null {
  if (isPlaceholderSupabaseUrl(process.env.NEXT_PUBLIC_SUPABASE_URL)) {
    return null;
  }
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
 * Pass an existing `supabase` client to avoid a second admin-client init (AUTH-006).
 */
export async function establishSession(
  profile: SessionProfile,
  teacherId: string | null,
  supabaseClient?: AuthSupabaseClient | null
): Promise<LoginState | { role: "TEACHER" | "STUDENT" | "SUPER_ADMIN" }> {
  const supabase = supabaseClient ?? getAuthSupabaseClient();
  if (!supabase) {
    return authError(AuthErrorCode.SUPABASE_ENV_MISSING);
  }

  // [AUTH-007] Defense-in-depth: never mint / rotate last_session_id when inactive.
  const { assertCanEstablishSession } = await import("@/lib/account-access");
  const access = await assertCanEstablishSession(
    profile.id,
    profile.role,
    supabase
  );
  if (!access.ok) {
    return authError(access.code);
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
  profile: SessionProfile
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
