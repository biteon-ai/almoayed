"use server";

import {
  authError,
  AuthErrorCode,
  logAuthFailure,
} from "@/lib/auth-error-codes";
import {
  establishSession,
  getAuthSupabaseClient,
  getPendingTeacherLinkSession,
} from "@/lib/auth-session";
import { isAuthDemoBypassEnabled } from "@/lib/admin-fallback";
import { startBiteonSwitchOtp } from "@/actions/biteonswitch";
import {
  DEMO_STUDENT,
  DEMO_TEACHER,
  normalizeWhatsAppNumber,
} from "@/lib/constants";
import { resolveDemoLoginIdentity } from "@/lib/demo-accounts";
import type { Profile } from "@/types/database";
import type { LoginState } from "@/types/auth";

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

/**
 * AUTH-002 + AUTH-001: register then immediately start BiteonSwitch OTP.
 */
export async function registerStudentAndRequestOTP(
  _prev: LoginState | null,
  formData: FormData
): Promise<LoginState> {
  try {
    const registered = await registerStudentImpl(formData);
    if (registered.status === "error") return registered;
    if (registered.status === "already_registered") return registered;

    const otp = await startBiteonSwitchOtp(null, formData);
    if (otp.status === "redirect") {
      return { status: "redirect", redirectUrl: otp.redirectUrl };
    }
    return authError(otp.code);
  } catch (error) {
    logAuthFailure("REGISTER_AND_OTP_UNEXPECTED", error);
    return authError(AuthErrorCode.LOGIN_UNEXPECTED);
  }
}

/**
 * After OTP: student verified but missing teacher link — attach رمز الأستاذ then mint session.
 */
export async function linkTeacherCodeAction(
  _prev: LoginState | null,
  formData: FormData
): Promise<LoginState> {
  try {
    const pending = await getPendingTeacherLinkSession();
    if (!pending) {
      return authError(AuthErrorCode.LOGIN_UNEXPECTED);
    }

    const teacherCode = (formData.get("teacher_code") as string)?.trim() ?? "";
    if (!teacherCode) {
      return authError(AuthErrorCode.TEACHER_CODE_REQUIRED);
    }

    const supabase = getAuthSupabaseClient();
    if (!supabase) {
      return authError(AuthErrorCode.SUPABASE_ENV_MISSING);
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

    const { error: upsertError } = await supabase.from("student_teachers").upsert(
      {
        student_id: pending.profileId,
        teacher_id: teacher.id,
        status: "pending",
        tier: "free",
      },
      { onConflict: "student_id,teacher_id" }
    );

    if (upsertError) {
      logAuthFailure("SUPABASE_STUDENT_LINK_FAILED", upsertError);
      return authError(AuthErrorCode.SUPABASE_STUDENT_LINK_FAILED);
    }

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("id, whatsapp_number, full_name, role")
      .eq("id", pending.profileId)
      .maybeSingle();

    if (profileError || !profile) {
      logAuthFailure("SUPABASE_PROFILE_FETCH_FAILED", profileError);
      return authError(AuthErrorCode.SUPABASE_PROFILE_FETCH_FAILED);
    }

    const sessionResult = await establishSession(profile, teacher.id, supabase);
    if ("status" in sessionResult && sessionResult.status === "error") {
      return sessionResult;
    }

    return { status: "success", role: "STUDENT" };
  } catch (error) {
    logAuthFailure("LINK_TEACHER_UNEXPECTED", error);
    return authError(AuthErrorCode.LOGIN_UNEXPECTED);
  }
}

/** Local/demo session mint for seeded identities only (FR-012 / FIX-AUTH-001). */
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

    const resolved = await resolveDemoLoginIdentity(supabase, whatsappNumber);
    if (!resolved.ok) return resolved.error;

    const sessionResult = await establishSession(
      resolved.profile,
      resolved.teacherId,
      supabase
    );
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
 * @deprecated Prefer registerStudentAndRequestOTP + BiteonSwitch OTP.
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

  return registerStudentAndRequestOTP(prev, formData);
}
