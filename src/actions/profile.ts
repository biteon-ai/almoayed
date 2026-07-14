"use server";

import { getIronSession } from "iron-session";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireAuthenticated } from "@/lib/auth";
import { validateDisplayName } from "@/lib/profile-name";
import { generateSessionToken } from "@/lib/session-token";
import { sessionOptions, type SessionData } from "@/lib/session";
import type { SettingsProfile } from "@/types/database";

export async function getSettingsProfile(): Promise<SettingsProfile> {
  const session = await requireAuthenticated();
  const supabase = createAdminClient();

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, whatsapp_number, role, teacher_code")
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
