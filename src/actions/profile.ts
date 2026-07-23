"use server";

import { getIronSession } from "iron-session";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireAuthenticated, requireStudent } from "@/lib/auth";
import { validateDisplayName } from "@/lib/profile-name";
import { generateSessionToken } from "@/lib/session-token";
import { sessionOptions, type SessionData } from "@/lib/session";
import {
  isRequiredProfileComplete,
  sanitizeReturnPath,
  validateOnboardingInput,
  validateRequiredProfileInput,
} from "@/lib/student-profile";
import type {
  EducationStage,
  ReferralSource,
  SettingsProfile,
  StudentDemographics,
} from "@/types/database";

type ActionResult<T = void> =
  | { ok: true; data?: T }
  | { ok: false; error: string };

function mapDemographics(row: {
  birth_date: string | null;
  education_stage: string | null;
  province: string | null;
  city: string | null;
  address: string | null;
  email: string | null;
  referral_source: string | null;
  primary_subject: string | null;
}): StudentDemographics {
  return {
    birthDate: row.birth_date,
    educationStage: row.education_stage as EducationStage | null,
    province: row.province,
    city: row.city,
    address: row.address ?? "",
    email: row.email,
    referralSource: row.referral_source as ReferralSource | null,
    primarySubject: row.primary_subject,
  };
}

export async function countUniqueCompletedQuizzes(
  studentId: string
): Promise<number> {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("exam_submissions")
    .select("quiz_id")
    .eq("student_id", studentId);

  if (!data?.length) return 0;
  return new Set(data.map((row) => row.quiz_id as string)).size;
}

export async function getStudentProfileState(): Promise<{
  onboardingCompleted: boolean;
  profileCompleted: boolean;
  uniqueCompletedQuizzes: number;
  fullName: string;
  demographics: StudentDemographics;
}> {
  const session = await requireStudent();
  const supabase = createAdminClient();

  const { data: profile } = await supabase
    .from("profiles")
    .select(
      "full_name, birth_date, education_stage, province, city, address, email, referral_source, primary_subject, onboarding_completed, profile_completed"
    )
    .eq("id", session.profileId)
    .single();

  const uniqueCompletedQuizzes = await countUniqueCompletedQuizzes(
    session.profileId
  );

  if (!profile) {
    return {
      onboardingCompleted: false,
      profileCompleted: false,
      uniqueCompletedQuizzes,
      fullName: session.fullName,
      demographics: {
        birthDate: null,
        educationStage: null,
        province: null,
        city: null,
        address: "",
        email: null,
        referralSource: null,
        primarySubject: null,
      },
    };
  }

  return {
    onboardingCompleted: Boolean(profile.onboarding_completed),
    profileCompleted: Boolean(profile.profile_completed),
    uniqueCompletedQuizzes,
    fullName: profile.full_name as string,
    demographics: mapDemographics(profile as Parameters<typeof mapDemographics>[0]),
  };
}

export async function completeStudentOnboarding(input: {
  educationStage: string;
  referralSource: string;
  primarySubject: string;
}): Promise<ActionResult> {
  const session = await requireStudent();
  const validated = validateOnboardingInput(input);
  if (!validated.ok) {
    return { ok: false, error: validated.message };
  }

  const supabase = createAdminClient();
  const { error } = await supabase
    .from("profiles")
    .update({
      education_stage: validated.value.educationStage,
      referral_source: validated.value.referralSource,
      primary_subject: validated.value.primarySubject,
      onboarding_completed: true,
    })
    .eq("id", session.profileId)
    .eq("role", "STUDENT");

  if (error) {
    return { ok: false, error: "ما قدرنا نحفظ بياناتك — جرّب مرة تانية." };
  }

  revalidatePath("/onboarding");
  revalidatePath("/dashboard");
  revalidatePath("/settings");
  return { ok: true };
}

export async function completeRequiredStudentProfile(input: {
  fullName: string;
  birthDate: string;
  province: string;
  city: string;
  educationStage: string;
  email?: string;
  address?: string;
  from?: string;
}): Promise<ActionResult<{ redirectTo: string }>> {
  const session = await requireStudent();
  const validated = validateRequiredProfileInput(input);
  if (!validated.ok) {
    return { ok: false, error: validated.message };
  }

  const supabase = createAdminClient();
  const { error } = await supabase
    .from("profiles")
    .update({
      full_name: validated.value.fullName,
      birth_date: validated.value.birthDate,
      province: validated.value.province,
      city: validated.value.city,
      education_stage: validated.value.educationStage,
      email: validated.value.email,
      address: validated.value.address,
      profile_completed: true,
    })
    .eq("id", session.profileId)
    .eq("role", "STUDENT");

  if (error) {
    return { ok: false, error: "ما قدرنا نحفظ الملف — جرّب مرة تانية." };
  }

  const cookieStore = await cookies();
  const iron = await getIronSession<SessionData>(cookieStore, sessionOptions);
  iron.fullName = validated.value.fullName;
  await iron.save();

  const redirectTo = sanitizeReturnPath(input.from);
  revalidatePath("/profile/complete");
  revalidatePath("/dashboard");
  revalidatePath("/settings");
  revalidatePath("/quiz", "layout");

  return { ok: true, data: { redirectTo } };
}

export async function updateStudentDemographics(input: {
  fullName: string;
  birthDate: string;
  province: string;
  city: string;
  educationStage: string;
  email?: string;
  address?: string;
  referralSource?: string;
  primarySubject?: string;
}): Promise<ActionResult> {
  const session = await requireStudent();
  const validated = validateRequiredProfileInput(input);
  if (!validated.ok) {
    return { ok: false, error: validated.message };
  }

  const profileCompleted = isRequiredProfileComplete({
    fullName: validated.value.fullName,
    birthDate: validated.value.birthDate,
    province: validated.value.province,
    city: validated.value.city,
    educationStage: validated.value.educationStage,
    email: validated.value.email,
  });

  const supabase = createAdminClient();
  const patch: Record<string, unknown> = {
    full_name: validated.value.fullName,
    birth_date: validated.value.birthDate,
    province: validated.value.province,
    city: validated.value.city,
    education_stage: validated.value.educationStage,
    email: validated.value.email,
    address: validated.value.address,
    profile_completed: profileCompleted,
  };

  if (input.referralSource) {
    patch.referral_source = input.referralSource;
  }
  if (input.primarySubject?.trim()) {
    patch.primary_subject = input.primarySubject.trim();
  }

  const { error } = await supabase
    .from("profiles")
    .update(patch)
    .eq("id", session.profileId)
    .eq("role", "STUDENT");

  if (error) {
    return { ok: false, error: "ما قدرنا نحفظ التعديلات — جرّب مرة تانية." };
  }

  const cookieStore = await cookies();
  const iron = await getIronSession<SessionData>(cookieStore, sessionOptions);
  iron.fullName = validated.value.fullName;
  await iron.save();

  revalidatePath("/settings");
  revalidatePath("/dashboard");
  return { ok: true };
}

export async function getSettingsProfile(): Promise<SettingsProfile> {
  const session = await requireAuthenticated();
  const supabase = createAdminClient();

  const { data: profile } = await supabase
    .from("profiles")
    .select(
      "full_name, whatsapp_number, role, teacher_code, birth_date, education_stage, province, city, address, email, referral_source, primary_subject, onboarding_completed, profile_completed"
    )
    .eq("id", session.profileId)
    .single();

  if (!profile) {
    return {
      fullName: session.fullName,
      whatsappNumber: session.whatsappNumber,
      role: session.role,
      activeTeacherCode: null,
      tier: null,
      upgradeRequested: false,
      teacherCode: null,
    };
  }

  const base: SettingsProfile = {
    fullName: profile.full_name,
    whatsappNumber: profile.whatsapp_number,
    role: profile.role,
    activeTeacherCode: null,
    tier: null,
    upgradeRequested: false,
    teacherCode: profile.role === "TEACHER" ? profile.teacher_code : null,
  };

  if (profile.role === "STUDENT") {
    base.demographics = mapDemographics(
      profile as Parameters<typeof mapDemographics>[0]
    );
    base.onboardingCompleted = Boolean(profile.onboarding_completed);
    base.profileCompleted = Boolean(profile.profile_completed);
  }

  if (profile.role !== "STUDENT" || !session.currentTeacherId) {
    return base;
  }

  const { data: link } = await supabase
    .from("student_teachers")
    .select(
      `
      tier,
      upgrade_requested,
      profiles:teacher_id (teacher_code)
    `
    )
    .eq("student_id", session.profileId)
    .eq("teacher_id", session.currentTeacherId)
    .eq("status", "active")
    .maybeSingle();

  if (!link) {
    return base;
  }

  const teacher = link.profiles as unknown as { teacher_code: string } | null;

  return {
    ...base,
    activeTeacherCode: teacher?.teacher_code ?? null,
    tier: link.tier as SettingsProfile["tier"],
    upgradeRequested: Boolean(link.upgrade_requested),
  };
}

export async function updateProfileName(
  formData: FormData
): Promise<{ success: boolean; message: string }> {
  const session = await requireAuthenticated();
  const rawName = (formData.get("full_name") as string) ?? "";
  const validated = validateDisplayName(rawName);

  if (!validated.ok) {
    return { success: false, message: validated.message };
  }

  const supabase = createAdminClient();
  const { error } = await supabase
    .from("profiles")
    .update({ full_name: validated.value })
    .eq("id", session.profileId);

  if (error) {
    return { success: false, message: "ما قدرنا نحفظ الاسم — جرّب مرة تانية." };
  }

  const cookieStore = await cookies();
  const iron = await getIronSession<SessionData>(cookieStore, sessionOptions);
  iron.fullName = validated.value;
  await iron.save();

  revalidatePath("/settings");
  revalidatePath("/teacher/settings");
  revalidatePath("/dashboard");
  revalidatePath("/teacher/dashboard");

  return { success: true, message: "تم حفظ الاسم بنجاح." };
}

export async function logoutOtherDevices(): Promise<{
  success: boolean;
  message: string;
}> {
  const session = await requireAuthenticated();
  const supabase = createAdminClient();
  const newToken = generateSessionToken();

  const { error } = await supabase
    .from("profiles")
    .update({ last_session_id: newToken })
    .eq("id", session.profileId);

  if (error) {
    return {
      success: false,
      message: "ما قدرنا نسجّل خروج الأجهزة الأخرى — جرّب مرة تانية.",
    };
  }

  const cookieStore = await cookies();
  const iron = await getIronSession<SessionData>(cookieStore, sessionOptions);
  iron.sessionToken = newToken;
  await iron.save();

  return {
    success: true,
    message: "تم تسجيل خروج الأجهزة الأخرى — جلسة هذا الجهاز فقط نشطة الآن.",
  };
}
