import { Suspense } from "react";
import { redirect } from "next/navigation";
import { getStudentProfile, getStudentResultsPageData } from "@/actions/quiz";
import { getStudentGamificationStatus } from "@/actions/gamification";
import { requireStudent } from "@/lib/auth";
import { APP_DESCRIPTION } from "@/lib/constants";
import { StudentResultsView } from "@/components/student/StudentResultsView";
import { PageLoadingView } from "@/components/ui/page-loading-view";

/** Auth + live scores — request-scoped; route JS prefetched from login/chrome. */
export const dynamic = "force-dynamic";

export const metadata = {
  title: "نتائجي",
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
        <PageLoadingView
          message="جاري تحميل النتائج..."
          subMessage="نحضّر علاماتك والمحاولات السابقة"
        />
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
