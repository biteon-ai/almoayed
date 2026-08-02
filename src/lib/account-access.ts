import { AuthErrorCode } from "@/lib/auth-error-codes";
import { createAdminClient } from "@/lib/supabase/admin";
import type {
  StudentTeacherStatus,
  TeacherAccountStatus,
  UserRole,
} from "@/types/database";

type AdminClient = ReturnType<typeof createAdminClient>;

export type StudentLinkRow = {
  teacher_id: string;
  status: StudentTeacherStatus;
  created_at: string;
};

/** [AUTH-007] Teacher may log in when account status is active. */
export function isTeacherAccountActive(
  status: TeacherAccountStatus | null | undefined
): boolean {
  return status === "active";
}

/**
 * [AUTH-007] Student blocked when zero active links and ≥1 deactivated.
 * Pending-only / empty links are NOT blocked here (AUTH-002 / needs-teacher).
 */
export function isStudentDeactivatedForLogin(
  links: { status: StudentTeacherStatus | string }[]
): boolean {
  let active = 0;
  let deactivated = 0;
  for (const link of links) {
    if (link.status === "active") active += 1;
    else if (link.status === "deactivated") deactivated += 1;
  }
  return active === 0 && deactivated >= 1;
}

/**
 * Prefer `preferredTeacherId` if still active; else oldest active by created_at.
 */
export function resolveActiveTeacherId(
  links: StudentLinkRow[],
  preferredTeacherId: string | null
): string | null {
  const active = links
    .filter((l) => l.status === "active")
    .slice()
    .sort(
      (a, b) =>
        new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    );

  if (active.length === 0) return null;

  if (
    preferredTeacherId &&
    active.some((l) => l.teacher_id === preferredTeacherId)
  ) {
    return preferredTeacherId;
  }

  return active[0]?.teacher_id ?? null;
}

export type AssertCanEstablishResult =
  | { ok: true; teacherId: string | null }
  | { ok: false; code: typeof AuthErrorCode.ACCOUNT_INACTIVE };

/**
 * [AUTH-007] Load eligibility before minting iron-session / updating last_session_id.
 */
export async function assertCanEstablishSession(
  profileId: string,
  role: UserRole | string,
  supabaseClient?: AdminClient | null
): Promise<AssertCanEstablishResult> {
  let supabase: AdminClient;
  try {
    supabase = supabaseClient ?? createAdminClient();
  } catch {
    return { ok: false, code: AuthErrorCode.ACCOUNT_INACTIVE };
  }

  if (role === "TEACHER") {
    const { data } = await supabase
      .from("profiles")
      .select("teacher_account_status")
      .eq("id", profileId)
      .maybeSingle<{ teacher_account_status: TeacherAccountStatus }>();

    if (!isTeacherAccountActive(data?.teacher_account_status)) {
      return { ok: false, code: AuthErrorCode.ACCOUNT_INACTIVE };
    }
    return { ok: true, teacherId: null };
  }

  if (role === "STUDENT") {
    const { data: links } = await supabase
      .from("student_teachers")
      .select("teacher_id, status, created_at")
      .eq("student_id", profileId)
      .order("created_at", { ascending: true });

    const rows = (links ?? []) as StudentLinkRow[];
    if (isStudentDeactivatedForLogin(rows)) {
      return { ok: false, code: AuthErrorCode.ACCOUNT_INACTIVE };
    }
    return {
      ok: true,
      teacherId: resolveActiveTeacherId(rows, null),
    };
  }

  // SUPER_ADMIN and other roles: not gated by AUTH-007 teacher/student rules.
  return { ok: true, teacherId: null };
}
