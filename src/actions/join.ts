"use server";

import { redirect } from "next/navigation";
import { startBiteonSwitchOtp } from "@/actions/biteonswitch";
import {
  assertCanEstablishSession,
  isStudentDeactivatedForLogin,
} from "@/lib/account-access";
import {
  authError,
  AuthErrorCode,
  logAuthFailure,
} from "@/lib/auth-error-codes";
import {
  establishSession,
  getAuthSupabaseClient,
} from "@/lib/auth-session";
import { requireStudent } from "@/lib/auth";
import { upsertActiveStudentTeacherLink } from "@/lib/trial-join-link";
import { TRIAL_JOIN_MESSAGES } from "@/lib/trial-join-messages";
import {
  isJoinTeacherActive,
  validateTrialJoinForm,
} from "@/lib/trial-join";
import { resolveTeacherForJoinCode } from "@/lib/trial-join-server";
import type { Profile } from "@/types/database";

export type JoinState =
  | { status: "success"; role: "STUDENT" }
  | { status: "redirect"; redirectUrl: string }
  | { status: "fixed_otp_required"; stateId: string; whatsapp: string }
  | { status: "error"; code: AuthErrorCode; message?: string };

function joinFieldsFromFormData(formData: FormData): {
  teacherCode: string;
  firstName: string;
  lastName: string;
  educationStage: string;
  birthDate: string;
  whatsappNumber: string;
} {
  return {
    teacherCode: (formData.get("teacher_code") as string)?.trim() ?? "",
    firstName: (formData.get("first_name") as string)?.trim() ?? "",
    lastName: (formData.get("last_name") as string)?.trim() ?? "",
    educationStage: (formData.get("education_stage") as string)?.trim() ?? "",
    birthDate: (formData.get("birth_date") as string)?.trim() ?? "",
    whatsappNumber: (formData.get("whatsapp_number") as string)?.trim() ?? "",
  };
}

async function startJoinOtpRedirect(
  whatsapp: string,
  teacherCode: string
): Promise<JoinState> {
  const fd = new FormData();
  fd.set("whatsapp_number", whatsapp);
  fd.set("join_teacher_code", teacherCode);
  const otp = await startBiteonSwitchOtp(null, fd);
  if (otp.status === "redirect") {
    return { status: "redirect", redirectUrl: otp.redirectUrl };
  }
  if (otp.status === "fixed_otp_required") {
    return {
      status: "fixed_otp_required",
      stateId: otp.stateId,
      whatsapp,
    };
  }
  return authError(
    otp.status === "error" ? otp.code : AuthErrorCode.OTP_UNAVAILABLE
  ) as JoinState;
}

export async function joinTrialStudent(
  _prev: JoinState | null,
  formData: FormData
): Promise<JoinState> {
  try {
    const fields = joinFieldsFromFormData(formData);
    const validated = validateTrialJoinForm({
      firstName: fields.firstName,
      lastName: fields.lastName,
      educationStage: fields.educationStage,
      birthDate: fields.birthDate,
      whatsappNumber: fields.whatsappNumber,
    });

    if (!validated.ok) {
      return {
        status: "error",
        code: AuthErrorCode.MISSING_FULL_NAME,
        message: validated.message,
      };
    }

    const supabase = getAuthSupabaseClient();
    if (!supabase) {
      return authError(AuthErrorCode.SUPABASE_ENV_MISSING);
    }

    const teacher = await resolveTeacherForJoinCode(fields.teacherCode, supabase);
    if (!teacher) {
      return authError(AuthErrorCode.INVALID_TEACHER_CODE);
    }
    if (!isJoinTeacherActive(teacher)) {
      return {
        status: "error",
        code: AuthErrorCode.ACCOUNT_INACTIVE,
        message: TRIAL_JOIN_MESSAGES.inactiveTeacher,
      };
    }

    const { data: existing, error: profileErr } = await supabase
      .from("profiles")
      .select("id, whatsapp_number, full_name, role")
      .eq("whatsapp_number", validated.whatsapp)
      .maybeSingle<Pick<Profile, "id" | "whatsapp_number" | "full_name" | "role">>();

    if (profileErr) {
      logAuthFailure("JOIN_PROFILE_LOOKUP_FAILED", profileErr);
      return authError(AuthErrorCode.SUPABASE_PROFILE_FETCH_FAILED);
    }

    if (existing) {
      if (existing.role !== "STUDENT") {
        return {
          status: "error",
          code: AuthErrorCode.LOGIN_UNEXPECTED,
          message: TRIAL_JOIN_MESSAGES.teacherWhatsapp,
        };
      }

      const { data: links, error: linksErr } = await supabase
        .from("student_teachers")
        .select("status")
        .eq("student_id", existing.id);

      if (linksErr) {
        logAuthFailure("JOIN_LINKS_LOOKUP_FAILED", linksErr);
        return authError(AuthErrorCode.SUPABASE_CONNECTION_ERROR);
      }

      if (isStudentDeactivatedForLogin(links ?? [])) {
        return {
          status: "error",
          code: AuthErrorCode.ACCOUNT_INACTIVE,
          message: TRIAL_JOIN_MESSAGES.inactiveTeacher,
        };
      }

      return startJoinOtpRedirect(validated.whatsapp, teacher.teacher_code);
    }

    const { data: created, error: createErr } = await supabase
      .from("profiles")
      .insert({
        whatsapp_number: validated.whatsapp,
        full_name: validated.fullName,
        role: "STUDENT",
        birth_date: validated.birthDate,
        education_stage: validated.educationStage,
        referral_source: "whatsapp",
        onboarding_completed: true,
        profile_completed: false,
        is_subscribed: true,
      })
      .select("id, whatsapp_number, full_name, role")
      .single<Pick<Profile, "id" | "whatsapp_number" | "full_name" | "role">>();

    if (createErr || !created) {
      if (createErr?.code === "23505") {
        return startJoinOtpRedirect(validated.whatsapp, teacher.teacher_code);
      }
      logAuthFailure("JOIN_PROFILE_CREATE_FAILED", createErr);
      return authError(AuthErrorCode.SUPABASE_PROFILE_CREATE_FAILED);
    }

    const linkResult = await upsertActiveStudentTeacherLink(
      supabase,
      created.id,
      teacher.id
    );
    if (!linkResult.ok) {
      logAuthFailure("JOIN_LINK_CREATE_FAILED", linkResult.error);
      return authError(AuthErrorCode.SUPABASE_STUDENT_LINK_FAILED);
    }

    const sessionResult = await establishSession(created, teacher.id, supabase);
    if ("status" in sessionResult && sessionResult.status === "error") {
      return sessionResult as JoinState;
    }

    return { status: "success", role: "STUDENT" };
  } catch (error) {
    logAuthFailure("JOIN_UNEXPECTED", error);
    return authError(AuthErrorCode.LOGIN_UNEXPECTED);
  }
}

export async function linkSignedInStudentToJoinCode(
  teacherCode: string
): Promise<void> {
  const session = await requireStudent();
  const supabase = getAuthSupabaseClient();
  if (!supabase) {
    redirect("/login?error=otp_unavailable");
  }

  const teacher = await resolveTeacherForJoinCode(teacherCode, supabase);
  if (!teacher || !isJoinTeacherActive(teacher)) {
    redirect("/dashboard");
  }

  if (session.currentTeacherId === teacher.id) {
    redirect("/dashboard");
  }

  const linkResult = await upsertActiveStudentTeacherLink(
    supabase,
    session.profileId,
    teacher.id,
    { preserveProTier: true }
  );
  if (!linkResult.ok) {
    redirect("/dashboard");
  }

  const access = await assertCanEstablishSession(
    session.profileId,
    "STUDENT",
    supabase
  );
  if (!access.ok) {
    redirect("/login?error=account_inactive");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, whatsapp_number, full_name, role")
    .eq("id", session.profileId)
    .maybeSingle<Pick<Profile, "id" | "whatsapp_number" | "full_name" | "role">>();

  if (!profile) {
    redirect("/login");
  }

  const sessionResult = await establishSession(profile, teacher.id, supabase);
  if ("status" in sessionResult && sessionResult.status === "error") {
    redirect("/login?error=account_inactive");
  }

  redirect("/dashboard");
}

/** Server redirect helper after successful join form submit. */
export async function redirectAfterJoinSuccess(): Promise<void> {
  redirect("/dashboard");
}
