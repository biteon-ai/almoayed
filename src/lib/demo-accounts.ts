import {
  DEMO_STUDENT,
  DEMO_TEACHER,
} from "@/lib/constants";
import {
  authError,
  AuthErrorCode,
  logAuthFailure,
} from "@/lib/auth-error-codes";
import type { AuthSupabaseClient, SessionProfile } from "@/lib/auth-session";
import type { LoginState } from "@/types/auth";
import type { Profile } from "@/types/database";

/** Stable seed UUIDs — match `supabase/migrations/002_seed_demo.sql`. */
export const DEMO_TEACHER_ID = "11111111-1111-1111-1111-111111111111";
export const DEMO_STUDENT_ID = "22222222-2222-2222-2222-222222222222";

type DemoResolveOk = {
  ok: true;
  profile: SessionProfile;
  teacherId: string | null;
};

type DemoResolveErr = { ok: false; error: LoginState };

type ProfileRow = {
  id: string;
  whatsapp_number: string | null;
  full_name: string;
  role: Profile["role"];
};

/**
 * FIX-AUTH-001: resolve demo identities via service-role client.
 * Happy path: 1–2 selects. Missing seed rows are auto-upserted.
 * Never embeds `student_teachers` from `profiles` (ambiguous dual FK → PostgREST error).
 */
export async function resolveDemoLoginIdentity(
  supabase: AuthSupabaseClient,
  whatsappNumber: string
): Promise<DemoResolveOk | DemoResolveErr> {
  const isStudent = whatsappNumber === DEMO_STUDENT.whatsapp_number;
  const isTeacher = whatsappNumber === DEMO_TEACHER.whatsapp_number;

  if (!isStudent && !isTeacher) {
    return { ok: false, error: authError(AuthErrorCode.DEMO_BYPASS_DISABLED) };
  }

  if (isTeacher) {
    const teacher = await ensureDemoTeacher(supabase);
    if (!teacher.ok) return teacher;
    return { ok: true, profile: teacher.profile, teacherId: null };
  }

  // Student happy path: profile + active link (no embed).
  const studentFetch = await fetchProfileByWhatsApp(
    supabase,
    DEMO_STUDENT.whatsapp_number
  );
  if (!studentFetch.ok) return studentFetch;

  if (studentFetch.profile) {
    if (studentFetch.profile.role !== "STUDENT") {
      logAuthFailure("DEMO_STUDENT_ROLE_MISMATCH", {
        role: studentFetch.profile.role,
      });
      return {
        ok: false,
        error: authError(AuthErrorCode.SUPABASE_PROFILE_FETCH_FAILED),
      };
    }

    const link = await fetchActiveTeacherId(supabase, studentFetch.profile.id);
    if (!link.ok) return link;

    if (link.teacherId) {
      return {
        ok: true,
        profile: studentFetch.profile,
        teacherId: link.teacherId,
      };
    }

    const teacher = await ensureDemoTeacher(supabase);
    if (!teacher.ok) return teacher;

    const linked = await ensureDemoStudentTeacherLink(
      supabase,
      studentFetch.profile.id,
      teacher.profile.id
    );
    if (!linked.ok) return linked;

    return {
      ok: true,
      profile: studentFetch.profile,
      teacherId: teacher.profile.id,
    };
  }

  // Cold start: upsert teacher → student → link.
  const teacher = await ensureDemoTeacher(supabase);
  if (!teacher.ok) return teacher;

  const student = await ensureDemoStudent(supabase);
  if (!student.ok) return student;

  const linked = await ensureDemoStudentTeacherLink(
    supabase,
    student.profile.id,
    teacher.profile.id
  );
  if (!linked.ok) return linked;

  return {
    ok: true,
    profile: student.profile,
    teacherId: teacher.profile.id,
  };
}

async function fetchProfileByWhatsApp(
  supabase: AuthSupabaseClient,
  whatsappNumber: string
): Promise<{ ok: true; profile: SessionProfile | null } | DemoResolveErr> {
  const maxAttempts = 3;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, whatsapp_number, full_name, role")
        .eq("whatsapp_number", whatsappNumber)
        .maybeSingle<ProfileRow>();

      if (error) {
        const transient = isTransientSupabaseFailure(error);
        if (transient && attempt < maxAttempts) {
          await delay(200 * attempt);
          continue;
        }
        logAuthFailure("SUPABASE_PROFILE_FETCH_FAILED", error);
        return {
          ok: false,
          error: authError(AuthErrorCode.SUPABASE_PROFILE_FETCH_FAILED),
        };
      }

      return { ok: true, profile: data };
    } catch (error) {
      const transient = isTransientSupabaseFailure(error);
      if (transient && attempt < maxAttempts) {
        await delay(200 * attempt);
        continue;
      }
      logAuthFailure("SUPABASE_PROFILE_FETCH_FAILED", error);
      return {
        ok: false,
        error: authError(AuthErrorCode.SUPABASE_PROFILE_FETCH_FAILED),
      };
    }
  }

  return {
    ok: false,
    error: authError(AuthErrorCode.SUPABASE_PROFILE_FETCH_FAILED),
  };
}

function isTransientSupabaseFailure(error: unknown): boolean {
  const message =
    error instanceof Error
      ? error.message
      : typeof error === "object" &&
          error &&
          "message" in error &&
          typeof (error as { message: unknown }).message === "string"
        ? (error as { message: string }).message
        : String(error ?? "");
  return /abort|timeout|fetch failed|ECONNRESET|ETIMEDOUT|network/i.test(
    message
  );
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchActiveTeacherId(
  supabase: AuthSupabaseClient,
  studentId: string
): Promise<{ ok: true; teacherId: string | null } | DemoResolveErr> {
  try {
    const { data, error } = await supabase
      .from("student_teachers")
      .select("teacher_id")
      .eq("student_id", studentId)
      .eq("status", "active")
      .order("created_at", { ascending: true })
      .limit(1)
      .maybeSingle<{ teacher_id: string }>();

    if (error) {
      logAuthFailure("SUPABASE_STUDENT_LINK_FETCH_FAILED", error);
      return {
        ok: false,
        error: authError(AuthErrorCode.SUPABASE_CONNECTION_ERROR),
      };
    }

    return { ok: true, teacherId: data?.teacher_id ?? null };
  } catch (error) {
    logAuthFailure("SUPABASE_STUDENT_LINK_FETCH_FAILED", error);
    return {
      ok: false,
      error: authError(AuthErrorCode.SUPABASE_CONNECTION_ERROR),
    };
  }
}

async function ensureDemoTeacher(
  supabase: AuthSupabaseClient
): Promise<{ ok: true; profile: SessionProfile } | DemoResolveErr> {
  const existing = await fetchProfileByWhatsApp(
    supabase,
    DEMO_TEACHER.whatsapp_number
  );
  if (!existing.ok) return existing;
  if (existing.profile) {
    if (existing.profile.role !== "TEACHER") {
      logAuthFailure("DEMO_TEACHER_ROLE_MISMATCH", {
        role: existing.profile.role,
      });
      return {
        ok: false,
        error: authError(AuthErrorCode.SUPABASE_PROFILE_FETCH_FAILED),
      };
    }

    try {
      await supabase
        .from("profiles")
        .update({ teacher_code: DEMO_TEACHER.teacher_code })
        .eq("id", DEMO_TEACHER_ID)
        .neq("teacher_code", DEMO_TEACHER.teacher_code);
    } catch (error) {
      logAuthFailure("DEMO_TEACHER_CODE_SYNC_FAILED", error);
    }

    return { ok: true, profile: existing.profile };
  }

  try {
    const { data, error } = await supabase
      .from("profiles")
      .upsert(
        {
          id: DEMO_TEACHER_ID,
          whatsapp_number: DEMO_TEACHER.whatsapp_number,
          full_name: DEMO_TEACHER.full_name,
          role: "TEACHER",
          is_subscribed: true,
          teacher_code: DEMO_TEACHER.teacher_code,
        },
        { onConflict: "whatsapp_number" }
      )
      .select("id, whatsapp_number, full_name, role")
      .single<ProfileRow>();

    if (error || !data) {
      const retry = await fetchProfileByWhatsApp(
        supabase,
        DEMO_TEACHER.whatsapp_number
      );
      if (!retry.ok) return retry;
      if (retry.profile) return { ok: true, profile: retry.profile };

      logAuthFailure("DEMO_TEACHER_UPSERT_FAILED", error);
      return {
        ok: false,
        error: authError(AuthErrorCode.SUPABASE_PROFILE_FETCH_FAILED),
      };
    }

    return { ok: true, profile: data };
  } catch (error) {
    logAuthFailure("DEMO_TEACHER_UPSERT_FAILED", error);
    return {
      ok: false,
      error: authError(AuthErrorCode.SUPABASE_PROFILE_FETCH_FAILED),
    };
  }
}

async function ensureDemoStudent(
  supabase: AuthSupabaseClient
): Promise<{ ok: true; profile: SessionProfile } | DemoResolveErr> {
  const existing = await fetchProfileByWhatsApp(
    supabase,
    DEMO_STUDENT.whatsapp_number
  );
  if (!existing.ok) return existing;
  if (existing.profile) {
    if (existing.profile.role !== "STUDENT") {
      logAuthFailure("DEMO_STUDENT_ROLE_MISMATCH", {
        role: existing.profile.role,
      });
      return {
        ok: false,
        error: authError(AuthErrorCode.SUPABASE_PROFILE_FETCH_FAILED),
      };
    }
    return { ok: true, profile: existing.profile };
  }

  try {
    const { data, error } = await supabase
      .from("profiles")
      .upsert(
        {
          id: DEMO_STUDENT_ID,
          whatsapp_number: DEMO_STUDENT.whatsapp_number,
          full_name: DEMO_STUDENT.full_name,
          role: "STUDENT",
          is_subscribed: true,
        },
        { onConflict: "whatsapp_number" }
      )
      .select("id, whatsapp_number, full_name, role")
      .single<ProfileRow>();

    if (error || !data) {
      const retry = await fetchProfileByWhatsApp(
        supabase,
        DEMO_STUDENT.whatsapp_number
      );
      if (!retry.ok) return retry;
      if (retry.profile) return { ok: true, profile: retry.profile };

      logAuthFailure("DEMO_STUDENT_UPSERT_FAILED", error);
      return {
        ok: false,
        error: authError(AuthErrorCode.SUPABASE_PROFILE_FETCH_FAILED),
      };
    }

    return { ok: true, profile: data };
  } catch (error) {
    logAuthFailure("DEMO_STUDENT_UPSERT_FAILED", error);
    return {
      ok: false,
      error: authError(AuthErrorCode.SUPABASE_PROFILE_FETCH_FAILED),
    };
  }
}

async function ensureDemoStudentTeacherLink(
  supabase: AuthSupabaseClient,
  studentId: string,
  teacherId: string
): Promise<{ ok: true } | DemoResolveErr> {
  try {
    const { error } = await supabase.from("student_teachers").upsert(
      {
        student_id: studentId,
        teacher_id: teacherId,
        status: "active",
        tier: "free",
      },
      { onConflict: "student_id,teacher_id" }
    );

    if (error) {
      logAuthFailure("DEMO_STUDENT_LINK_UPSERT_FAILED", error);
      return {
        ok: false,
        error: authError(AuthErrorCode.SUPABASE_STUDENT_LINK_FAILED),
      };
    }

    return { ok: true };
  } catch (error) {
    logAuthFailure("DEMO_STUDENT_LINK_UPSERT_FAILED", error);
    return {
      ok: false,
      error: authError(AuthErrorCode.SUPABASE_STUDENT_LINK_FAILED),
    };
  }
}
