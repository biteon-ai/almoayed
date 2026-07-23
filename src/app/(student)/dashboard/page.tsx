import { redirect } from "next/navigation";
import { getStudentDashboardData, getStudentProfile } from "@/actions/quiz";
import { requireStudent } from "@/lib/auth";
import { APP_SLOGAN } from "@/lib/constants";
import { computeStudentGamification } from "@/lib/student-gamification";
import { StudentDashboardView } from "@/components/dashboard/StudentDashboardView";

export const metadata = {
  title: "لوحة الطالب | المؤيد",
  description: APP_SLOGAN,
};

export default async function DashboardPage() {
  const session = await requireStudent();

  const profile = await getStudentProfile();
  if (!profile?.is_subscribed) {
    redirect("/login");
  }

  const dashboard = await getStudentDashboardData();
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
      recentScores={dashboard.recentScores}
      weakPoints={dashboard.weakPoints}
      teachers={dashboard.teachers}
      currentTeacherId={session.currentTeacherId}
    />
  );
}
