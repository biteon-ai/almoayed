import { cookies } from "next/headers";
import { getIronSession } from "iron-session";
import { redirect } from "next/navigation";
import {
  isStudentDeactivatedForLogin,
  isTeacherAccountActive,
  resolveActiveTeacherId,
  type StudentLinkRow,
} from "@/lib/account-access";
import { isAuthDemoBypassEnabled } from "@/lib/admin-fallback";
import { DEMO_STUDENT, DEMO_TEACHER } from "@/lib/constants";
import { createAdminClient } from "@/lib/supabase/admin";
import { isDeviceSessionValid } from "@/lib/device-session";
import { requestCache } from "@/lib/request-cache";
import { sessionOptions, type SessionData } from "@/lib/session";
import type { TeacherAccountStatus } from "@/types/database";

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

type AccessRow = {
  last_session_id: string | null;
  teacher_account_status: TeacherAccountStatus | null;
};

/**
 * [AUTH-003] + [AUTH-007] Combined profile fetch for device lock and inactivity.
 * PERF-001: one profiles round-trip per validated request (when not demo bypass).
 */
async function loadProfileAccess(profileId: string): Promise<AccessRow | null> {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("profiles")
    .select("last_session_id, teacher_account_status")
    .eq("id", profileId)
    .maybeSingle<AccessRow>();
  return data;
}

async function loadStudentLinks(studentId: string): Promise<StudentLinkRow[]> {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("student_teachers")
    .select("teacher_id, status, created_at")
    .eq("student_id", studentId)
    .order("created_at", { ascending: true });
  return (data ?? []) as StudentLinkRow[];
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

  const access = await loadProfileAccess(session.profileId);
  return isDeviceSessionValid(session.sessionToken, access?.last_session_id);
}

/**
 * [PERF-001] One login + AUTH-003 device-lock + AUTH-007 inactive check per request.
 * Layout + page + nested Server Actions share this memoized result.
 * No Supabase in middleware (PERF-001) — enforcement lives here.
 */
const getValidatedSession = requestCache(async (): Promise<SessionData> => {
  const session = await getSession();
  if (!session.isLoggedIn || !session.profileId) {
    redirect("/login");
  }

  const demoBypass = isDemoBypassIdentity(session.whatsappNumber);
  let access: AccessRow | null = null;

  if (!demoBypass) {
    access = await loadProfileAccess(session.profileId);
    const valid = isDeviceSessionValid(
      session.sessionToken,
      access?.last_session_id
    );
    if (!valid) {
      // Cannot clear cookies here (Server Components). Login overwrites the session.
      redirect("/login?reason=device_lock");
    }
  } else {
    access = await loadProfileAccess(session.profileId);
  }

  // [AUTH-007] Mid-session inactivity
  if (session.role === "TEACHER") {
    const status =
      access?.teacher_account_status ??
      (await loadProfileAccess(session.profileId))?.teacher_account_status;
    if (!isTeacherAccountActive(status)) {
      redirect("/login?error=account_inactive");
    }
  }

  if (session.role === "STUDENT") {
    const links = await loadStudentLinks(session.profileId);
    if (isStudentDeactivatedForLogin(links)) {
      redirect("/login?error=account_inactive");
    }

    const nextTeacherId = resolveActiveTeacherId(
      links,
      session.currentTeacherId
    );
    if (nextTeacherId && nextTeacherId !== session.currentTeacherId) {
      // getSession is typed as SessionData; re-open iron-session to persist re-scope.
      const cookieStore = await cookies();
      const mutable = await getIronSession<SessionData>(
        cookieStore,
        sessionOptions
      );
      mutable.currentTeacherId = nextTeacherId;
      await mutable.save();
      session.currentTeacherId = nextTeacherId;
    }
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
