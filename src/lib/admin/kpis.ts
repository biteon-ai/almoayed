import { createAdminClient } from "@/lib/supabase/admin";
import type { AdminKpiSnapshot } from "@/types/database";

export async function getAdminKpis(): Promise<AdminKpiSnapshot> {
  const supabase = createAdminClient();

  const [
    usersRes,
    teachersRes,
    activeTeachersRes,
    inactiveTeachersRes,
    studentsRes,
    examsRes,
    publishedRes,
    draftRes,
    attemptsRes,
  ] = await Promise.all([
    supabase.from("profiles").select("id", { count: "exact", head: true }),
    supabase
      .from("profiles")
      .select("id", { count: "exact", head: true })
      .eq("role", "TEACHER"),
    supabase
      .from("profiles")
      .select("id", { count: "exact", head: true })
      .eq("role", "TEACHER")
      .eq("teacher_account_status", "active"),
    supabase
      .from("profiles")
      .select("id", { count: "exact", head: true })
      .eq("role", "TEACHER")
      .eq("teacher_account_status", "inactive"),
    supabase
      .from("profiles")
      .select("id", { count: "exact", head: true })
      .eq("role", "STUDENT"),
    supabase
      .from("quizzes")
      .select("id", { count: "exact", head: true })
      .eq("is_archived", false),
    supabase
      .from("quizzes")
      .select("id", { count: "exact", head: true })
      .eq("is_archived", false)
      .eq("is_active", true),
    supabase
      .from("quizzes")
      .select("id", { count: "exact", head: true })
      .eq("is_archived", false)
      .eq("is_active", false),
    supabase
      .from("exam_submissions")
      .select("id", { count: "exact", head: true }),
  ]);

  return {
    totalUsers: usersRes.count ?? 0,
    totalTeachers: teachersRes.count ?? 0,
    activeTeachers: activeTeachersRes.count ?? 0,
    inactiveTeachers: inactiveTeachersRes.count ?? 0,
    totalStudents: studentsRes.count ?? 0,
    totalExams: examsRes.count ?? 0,
    publishedExams: publishedRes.count ?? 0,
    draftExams: draftRes.count ?? 0,
    completedAttempts: attemptsRes.count ?? 0,
  };
}
