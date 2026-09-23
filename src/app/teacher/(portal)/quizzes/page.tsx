import { getTeacherQuizzes, type QuizListView } from "@/actions/teacher";
import { QuizManagement } from "@/components/teacher/QuizManagement";
import { SPEKIT } from "@/lib/spekit-targets";
import { Suspense } from "react";

export const metadata = { title: "الاختبارات" };

interface PageProps {
  searchParams: Promise<{ page?: string; view?: string }>;
}

export default async function TeacherQuizzesPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const page = Number(params.page) || 1;
  const view: QuizListView = params.view === "trash" ? "trash" : "active";
  const quizzesPage = await getTeacherQuizzes({ page }, { view });

  return (
    <div data-spekit={SPEKIT.teacherQuizzesPage}>
      <Suspense
        fallback={
          <p className="text-sm text-muted-foreground">جاري التحميل...</p>
        }
      >
        <QuizManagement quizzesPage={quizzesPage} view={view} />
      </Suspense>
    </div>
  );
}
