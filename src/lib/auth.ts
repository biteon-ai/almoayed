import { cookies } from "next/headers";
import { getIronSession } from "iron-session";
import { redirect } from "next/navigation";
import { isAuthDemoBypassEnabled } from "@/lib/admin-fallback";
import { DEMO_STUDENT, DEMO_TEACHER } from "@/lib/constants";
import { createAdminClient } from "@/lib/supabase/admin";
import { isDeviceSessionValid } from "@/lib/device-session";
import { requestCache } from "@/lib/request-cache";
import { sessionOptions, type SessionData } from "@/lib/session";

/** [PERF-001] Request-scoped session decrypt — one iron-session read per RSC tree. */
export const getSession = requestCache(async (): Promise<SessionData> => {
  const cookieStore = await cookies();
  return getIronSession<SessionData>(cookieStore, sessionOptions);
});

function isDemoBypassIdentity(whatsappNumber: string | undefined): boolean {
  if (!whatsappNumber || !isAuthDemoBypassEnabled()) return false;
  return (
    whatsappNumber === DEMO_STUDENT.whatsapp_number ||
    whatsappNumber === DEMO_TEACHER.whatsapp_number
  );
}

/** Invalidate session if another device logged in (device lock). */
export async function validateDeviceSession(
  session: SessionData
): Promise<boolean> {
  if (!session.isLoggedIn || !session.profileId) {
    return false;
  }

  // FIX-AUTH-001 / e2e: demo identities are shared; skip AUTH-003 when bypass is on.
  if (isDemoBypassIdentity(session.whatsappNumber)) {
    return true;
  }

  const supabase = createAdminClient();
  const { data } = await supabase
    .from("profiles")
    .select("last_session_id")
    .eq("id", session.profileId)
    .single();

  return isDeviceSessionValid(session.sessionToken, data?.last_session_id);
}

/**
 * [PERF-001] One login + AUTH-003 device-lock check per request.
 * Layout + page + nested Server Actions share this memoized result.
 */
const getValidatedSession = requestCache(async (): Promise<SessionData> => {
  const session = await getSession();
  if (!session.isLoggedIn || !session.profileId) {
    redirect("/login");
  }

  const valid = await validateDeviceSession(session);
  if (!valid) {
    // Cannot clear cookies here (Server Components). Login overwrites the session.
    redirect("/login?reason=device_lock");
  }

  return session;
});

export async function requireAuthenticated(): Promise<SessionData> {
  return getValidatedSession();
}

export async function requireStudent(): Promise<SessionData> {
  const session = await getValidatedSession();
  if (session.role !== "STUDENT") {
    redirect("/teacher/dashboard");
  }
  return session;
}

export async function requireTeacher(): Promise<SessionData> {
  const session = await getValidatedSession();
  if (session.role !== "TEACHER") {
    if (session.role === "SUPER_ADMIN") {
      redirect("/admin/dashboard");
    }
    redirect("/dashboard");
  }
  return session;
}

export async function requireSuperAdmin(): Promise<SessionData> {
  const session = await getValidatedSession();
  if (session.role !== "SUPER_ADMIN" || session.impersonation) {
    redirect("/admin/login");
  }
  return session;
}

export async function requireSubscribedStudent(): Promise<SessionData> {
  return requireStudent();
}

export async function getActiveTeacherId(
  session: SessionData
): Promise<string | null> {
  if (session.currentTeacherId) return session.currentTeacherId;

  const supabase = createAdminClient();
  const { data } = await supabase
    .from("student_teachers")
    .select("teacher_id")
    .eq("student_id", session.profileId)
    .eq("status", "active")
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  return data?.teacher_id ?? null;
}
