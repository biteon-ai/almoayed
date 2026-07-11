import { cookies } from "next/headers";
import { getIronSession } from "iron-session";
import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { isDeviceSessionValid } from "@/lib/device-session";
import { sessionOptions, type SessionData } from "@/lib/session";

export async function getSession(): Promise<SessionData> {
  const cookieStore = await cookies();
  return getIronSession<SessionData>(cookieStore, sessionOptions);
}

/** Invalidate session if another device logged in (device lock). */
export async function validateDeviceSession(
  session: SessionData
): Promise<boolean> {
  if (!session.isLoggedIn || !session.profileId) {
    return false;
  }

  const supabase = createAdminClient();
  const { data } = await supabase
    .from("profiles")
    .select("last_session_id")
    .eq("id", session.profileId)
    .single();

  return isDeviceSessionValid(session.sessionToken, data?.last_session_id);
}

async function enforceValidSession(session: SessionData): Promise<SessionData> {
  if (!session.isLoggedIn || !session.profileId) {
    redirect("/login");
  }

  const valid = await validateDeviceSession(session);
  if (!valid) {
    // Cannot clear cookies here (Server Components). Login overwrites the session.
    redirect("/login?reason=device_lock");
  }

  return session;
}

export async function requireStudent(): Promise<SessionData> {
  const session = await enforceValidSession(await getSession());
  if (session.role !== "STUDENT") {
    redirect("/teacher/dashboard");
  }
  return session;
}

export async function requireTeacher(): Promise<SessionData> {
  const session = await enforceValidSession(await getSession());
  if (session.role !== "TEACHER") {
    redirect("/dashboard");
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
