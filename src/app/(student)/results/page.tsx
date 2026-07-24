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

interface PageProps {
  searchParams: Promise<{ page?: string }>;
}

export default async function StudentResultsPage({ searchParams }: PageProps) {
  await requireStudent();

  const profile = await getStudentProfile();
  if (!profile?.is_subscribed) {
    redirect("/login");
  }

  const params = await searchParams;
  const page = Number(params.page) || 1;

  const [data, teacherGamification] = await Promise.all([
    getStudentResultsPageData({ page }),
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
        scoresPage={data.scores}
        totalQuizzes={data.totalQuizzes}
        teacherGamification={teacherGamification}
      />
    </Suspense>
  );
}
