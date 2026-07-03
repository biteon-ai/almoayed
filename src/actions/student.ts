"use server";

import { getIronSession } from "iron-session";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireStudent } from "@/lib/auth";
import { sessionOptions, type SessionData } from "@/lib/session";
import type { StudentTeacherOption } from "@/types/database";

export async function getStudentTeachers(): Promise<StudentTeacherOption[]> {
  const session = await requireStudent();
  const supabase = createAdminClient();

  const { data } = await supabase
    .from("student_teachers")
    .select(
      `
      teacher_id, status, tier,
      profiles:teacher_id (full_name, school_name, teacher_code)
    `
    )
    .eq("student_id", session.profileId)
    .eq("status", "active");

  if (!data) return [];

  return data.map((row) => {
    const p = row.profiles as unknown as {
      full_name: string;
      school_name: string;
      teacher_code: string;
    };
    return {
      teacherId: row.teacher_id as string,
      teacherName: p.full_name,
      schoolName: p.school_name,
      teacherCode: p.teacher_code,
      tier: row.tier as "free" | "pro",
      status: row.status as "active",
    };
  });
}

export async function switchTeacher(teacherId: string): Promise<void> {
  const session = await requireStudent();
  const supabase = createAdminClient();

  const { data: link } = await supabase
    .from("student_teachers")
    .select("id")
    .eq("student_id", session.profileId)
    .eq("teacher_id", teacherId)
    .eq("status", "active")
    .maybeSingle();

  if (!link) throw new Error("ما عندك صلاحية للتبديل لهاد الأستاذ.");

  const cookieStore = await cookies();
  const iron = await getIronSession<SessionData>(cookieStore, sessionOptions);
  iron.currentTeacherId = teacherId;
  await iron.save();

  revalidatePath("/dashboard");
  revalidatePath("/quiz", "layout");
}

export async function requestProUpgrade(): Promise<{ success: boolean; message: string }> {
  const session = await requireStudent();
  const supabase = createAdminClient();

  if (!session.currentTeacherId) {
    return { success: false, message: "اختار أستاذك أولاً من القائمة." };
  }

  const { error } = await supabase
    .from("student_teachers")
    .update({ upgrade_requested: true })
    .eq("student_id", session.profileId)
    .eq("teacher_id", session.currentTeacherId);

  if (error) {
    return { success: false, message: "ما قدرنا نرسل طلب الترقية. جرّب مرة تانية." };
  }

  revalidatePath("/dashboard");
  return {
    success: true,
    message: "تم إرسال طلب الترقية للأستاذ — رح يتواصل معك قريباً!",
  };
}

export async function getStudentTier(): Promise<"free" | "pro"> {
  const session = await requireStudent();
  if (!session.currentTeacherId) return "free";

  const supabase = createAdminClient();
  const { data } = await supabase
    .from("student_teachers")
    .select("tier")
    .eq("student_id", session.profileId)
    .eq("teacher_id", session.currentTeacherId)
    .maybeSingle();

  return (data?.tier as "free" | "pro") ?? "free";
}
