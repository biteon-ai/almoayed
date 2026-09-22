import { Suspense } from "react";
import { redirect } from "next/navigation";
import { getStudentProfile, getStudentResultsPageData } from "@/actions/quiz";
import { getStudentGamificationStatus } from "@/actions/gamification";
import { requireStudent } from "@/lib/auth";
import { APP_DESCRIPTION } from "@/lib/constants";
import { StudentResultsView } from "@/components/student/StudentResultsView";

export const metadata = {
  title: "نتائجي | المؤيد",
  description: APP_DESCRIPTION,
};

export default async function StudentResultsPage() {
  await requireStudent();

  const profile = await getStudentProfile();
  if (!profile?.is_subscribed) {
    redirect("/login");
  }

  const [data, teacherGamification] = await Promise.all([
    getStudentResultsPageData(),
    getStudentGamificationStatus(),
  ]);

  return (
    <Suspense
      fallback={
        <div className="container mx-auto max-w-7xl p-4 text-sm text-muted-foreground">
          جاري تحميل النتائج...
        </div>
      }
    >
      <StudentResultsView
        stats={data.stats}
        scores={data.scores}
        totalQuizzes={data.totalQuizzes}
        teacherGamification={teacherGamification}
      />
    </Suspense>
  );
}
