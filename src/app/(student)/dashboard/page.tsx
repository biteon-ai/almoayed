import { redirect } from "next/navigation";
import { getStudentDashboardData, getStudentProfile } from "@/actions/quiz";
import { getStudentGamificationStatus } from "@/actions/gamification";
import { requireStudent } from "@/lib/auth";
import { APP_DESCRIPTION } from "@/lib/constants";
import { computeStudentGamification } from "@/lib/student-gamification";
import { StudentDashboardView } from "@/components/dashboard/StudentDashboardView";

export const metadata = {
  title: "لوحة الطالب | المؤيد",
  description: APP_DESCRIPTION,
};

export default async function DashboardPage() {
  const session = await requireStudent();
  const profile = await getStudentProfile();
  if (!profile?.is_subscribed) {
    redirect("/login");
  }

  // PERF-001: parallel independent reads; requireStudent is request-cached (AUTH-003 once).
  const [dashboard, teacherGamification] = await Promise.all([
    getStudentDashboardData(),
    getStudentGamificationStatus(),
  ]);

  const gamification = computeStudentGamification({
    quizzes: dashboard.quizzes,
    recentScores: dashboard.recentScores,
    completedQuizCount: dashboard.stats.completedQuizCount,
  });

  return (
    <StudentDashboardView
      studentName={session.fullName || profile.full_name || "بالطالب"}
      stats={dashboard.stats}
      gamification={gamification}
      teacherGamification={teacherGamification}
      recentScores={dashboard.recentScores}
      weakPoints={dashboard.weakPoints}
      teachers={dashboard.teachers}
      currentTeacherId={session.currentTeacherId}
    />
  );
}
