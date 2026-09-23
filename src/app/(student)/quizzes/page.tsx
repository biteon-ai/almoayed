import { redirect } from "next/navigation";
import { getStudentProfile, getStudentQuizzesPageData } from "@/actions/quiz";
import { requireStudent } from "@/lib/auth";
import { APP_DESCRIPTION } from "@/lib/constants";
import { StudentQuizzesView } from "@/components/student/StudentQuizzesView";

/** Auth + paged quiz list — request-scoped; route JS prefetched from login/chrome. */
export const dynamic = "force-dynamic";

export const metadata = {
  title: "الاختبارات",
  description: APP_DESCRIPTION,
};

interface PageProps {
  searchParams: Promise<{ page?: string }>;
}

export default async function StudentQuizzesPage({ searchParams }: PageProps) {
  await requireStudent();

  const profile = await getStudentProfile();
  if (!profile?.is_subscribed) {
    redirect("/login");
  }

  const params = await searchParams;
  const page = Number(params.page) || 1;
  const data = await getStudentQuizzesPageData({ page });

  return (
    <StudentQuizzesView
      stats={data.stats}
      quizzesPage={data.quizzes}
      continueQuiz={data.continueQuiz}
    />
  );
}
