"use server";

import {
  authError,
  AuthErrorCode,
  logAuthFailure,
} from "@/lib/auth-error-codes";
import {
  establishSession,
  getAuthSupabaseClient,
} from "@/lib/auth-session";
import { isAuthDemoBypassEnabled } from "@/lib/admin-fallback";
import {
  DEMO_STUDENT,
  DEMO_TEACHER,
  normalizeWhatsAppNumber,
} from "@/lib/constants";
import type { Profile } from "@/types/database";
import type { LoginState } from "@/types/auth";

async function resolveStudentTeacherId(
  supabase: NonNullable<ReturnType<typeof getAuthSupabaseClient>>,
  studentId: string,
  fallbackTeacherId: string | null
): Promise<{ teacherId: string | null; error: LoginState | null }> {
  const { data: activeLink, error: linkFetchError } = await supabase
    .from("student_teachers")
    .select("teacher_id, status")
    .eq("student_id", studentId)
    .eq("status", "active")
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (linkFetchError) {
    logAuthFailure("SUPABASE_STUDENT_LINK_FETCH_FAILED", linkFetchError);
    return {
      teacherId: null,
      error: authError(AuthErrorCode.SUPABASE_CONNECTION_ERROR),
    };
  }

  return {
    teacherId: activeLink?.teacher_id ?? fallbackTeacherId,
    error: null,
  };
}

/** AUTH-002: create profile + teacher link; does NOT mint a session. */
export async function registerStudent(
  _prev: LoginState | null,
  formData: FormData
): Promise<LoginState> {
  try {
    return await registerStudentImpl(formData);
  } catch (error) {
    logAuthFailure("REGISTER_UNEXPECTED", error);
    return authError(AuthErrorCode.LOGIN_UNEXPECTED);
  }
}

async function registerStudentImpl(formData: FormData): Promise<LoginState> {
  const rawNumber = formData.get("whatsapp_number");
  const fullName = (formData.get("full_name") as string)?.trim() ?? "";
  const teacherCode = (formData.get("teacher_code") as string)?.trim() ?? "";

  if (!rawNumber || typeof rawNumber !== "string") {
    return authError(AuthErrorCode.MISSING_WHATSAPP);
  }

  const whatsappNumber = normalizeWhatsAppNumber(rawNumber);
  if (whatsappNumber.length < 10 || whatsappNumber.length > 15) {
    return authError(AuthErrorCode.INVALID_WHATSAPP);
  }

  if (!fullName) {
    return authError(AuthErrorCode.MISSING_FULL_NAME);
  }

  if (!teacherCode) {
    return authError(AuthErrorCode.TEACHER_CODE_REQUIRED);
  }

  const supabase = getAuthSupabaseClient();
  if (!supabase) {
    return authError(AuthErrorCode.SUPABASE_ENV_MISSING);
  }

  const { data: existing, error: fetchError } = await supabase
    .from("profiles")
    .select("id")
    .eq("whatsapp_number", whatsappNumber)
    .maybeSingle();

  if (fetchError) {
    logAuthFailure("SUPABASE_PROFILE_FETCH_FAILED", fetchError);
    return authError(AuthErrorCode.SUPABASE_PROFILE_FETCH_FAILED);
  }

  if (existing) {
    return { status: "already_registered" };
  }

  const { data: teacher, error: teacherLookupError } = await supabase
    .from("profiles")
    .select("id")
    .eq("teacher_code", teacherCode)
    .eq("role", "TEACHER")
    .maybeSingle();

  if (teacherLookupError) {
    logAuthFailure("SUPABASE_TEACHER_LOOKUP_FAILED", teacherLookupError);
    return authError(AuthErrorCode.SUPABASE_CONNECTION_ERROR);
  }

  if (!teacher) {
    return authError(AuthErrorCode.INVALID_TEACHER_CODE);
  }

  const { data: created, error: createError } = await supabase
    .from("profiles")
    .insert({
      whatsapp_number: whatsappNumber,
      full_name: fullName,
      role: "STUDENT",
      is_subscribed: false,
    })
    .select()
    .single<Profile>();

  if (createError || !created) {
    logAuthFailure("SUPABASE_PROFILE_CREATE_FAILED", createError);
    return authError(AuthErrorCode.SUPABASE_PROFILE_CREATE_FAILED);
  }

  const { error: linkError } = await supabase.from("student_teachers").insert({
    student_id: created.id,
    teacher_id: teacher.id,
    status: "pending",
    tier: "free",
  });

  if (linkError) {
    logAuthFailure("SUPABASE_STUDENT_LINK_FAILED", linkError);
    return authError(AuthErrorCode.SUPABASE_STUDENT_LINK_FAILED);
  }

  return { status: "registered", next: "otp" };
}

/** Local/demo session mint for seeded identities only (FR-012). */
export async function loginDemoAccount(
  _prev: LoginState | null,
  formData: FormData
): Promise<LoginState> {
  try {
    if (!isAuthDemoBypassEnabled()) {
      return authError(AuthErrorCode.DEMO_BYPASS_DISABLED);
    }

    const rawNumber = formData.get("whatsapp_number");
    if (!rawNumber || typeof rawNumber !== "string") {
      return authError(AuthErrorCode.MISSING_WHATSAPP);
    }

    const whatsappNumber = normalizeWhatsAppNumber(rawNumber);
    const isDemoStudent = whatsappNumber === DEMO_STUDENT.whatsapp_number;
    const isDemoTeacher = whatsappNumber === DEMO_TEACHER.whatsapp_number;

    if (!isDemoStudent && !isDemoTeacher) {
      return authError(AuthErrorCode.DEMO_BYPASS_DISABLED);
    }

    const supabase = getAuthSupabaseClient();
    if (!supabase) {
      return authError(AuthErrorCode.SUPABASE_ENV_MISSING);
    }

    const { data: profile, error: fetchError } = await supabase
      .from("profiles")
      .select("*")
      .eq("whatsapp_number", whatsappNumber)
      .maybeSingle<Profile>();

    if (fetchError) {
      logAuthFailure("SUPABASE_PROFILE_FETCH_FAILED", fetchError);
      return authError(AuthErrorCode.SUPABASE_PROFILE_FETCH_FAILED);
    }

    if (!profile) {
      return authError(AuthErrorCode.SUPABASE_PROFILE_FETCH_FAILED);
    }

    let teacherId: string | null = null;
    if (profile.role === "STUDENT") {
      const resolved = await resolveStudentTeacherId(supabase, profile.id, null);
      if (resolved.error) return resolved.error;
      teacherId = resolved.teacherId;
    }

    const sessionResult = await establishSession(profile, teacherId);
    if ("status" in sessionResult && sessionResult.status === "error") {
      return sessionResult;
    }

    const { role } = sessionResult as { role: "TEACHER" | "STUDENT" };
    return { status: "success", role };
  } catch (error) {
    logAuthFailure("DEMO_LOGIN_UNEXPECTED", error);
    return authError(AuthErrorCode.LOGIN_UNEXPECTED);
  }
}

/**
 * @deprecated Prefer registerStudent + BiteonSwitch OTP.
 * Kept as alias for any residual callers — routes to register or demo.
 */
export async function loginWithWhatsApp(
  prev: LoginState | null,
  formData: FormData
): Promise<LoginState> {
  const teacherCode = (formData.get("teacher_code") as string)?.trim() ?? "";
  const rawNumber = formData.get("whatsapp_number");
  const whatsappNumber =
    typeof rawNumber === "string" ? normalizeWhatsAppNumber(rawNumber) : "";

  if (
    isAuthDemoBypassEnabled() &&
    !teacherCode &&
    (whatsappNumber === DEMO_STUDENT.whatsapp_number ||
      whatsappNumber === DEMO_TEACHER.whatsapp_number)
  ) {
    return loginDemoAccount(prev, formData);
  }

  return registerStudent(prev, formData);
}
