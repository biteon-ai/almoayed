import { getQuizQuestions, getTeacherQuizById } from "@/actions/teacher";
import { QuizQuestionsDashboard } from "@/components/teacher/QuizQuestionsDashboard";
import { QuizTimerSettings } from "@/components/teacher/QuizTimerSettings";
import { QuizTrashBanner } from "@/components/teacher/QuizTrashBanner";
import { EditQuizImportToast } from "@/components/teacher/EditQuizImportToast";
import { SPEKIT } from "@/lib/spekit-targets";
import { notFound } from "next/navigation";
import { Suspense } from "react";

export const metadata = { title: "تحرير الاختبار | المؤيد" };

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function EditQuizPage({ params }: PageProps) {
  const { id } = await params;
  const quiz = await getTeacherQuizById(id);
  if (!quiz) notFound();

  const questions = await getQuizQuestions(id);

  return (
    <div
      className="mx-auto w-full max-w-7xl"
      data-spekit={SPEKIT.teacherQuizEditPage}
    >
      <Suspense fallback={null}>
        <EditQuizImportToast />
      </Suspense>

      {quiz.deleted_at ? (
        <QuizTrashBanner quizId={quiz.id} quizTitle={quiz.title} />
      ) : null}

      {!quiz.deleted_at ? (
        <div className="px-4 pt-4 sm:px-6">
          <QuizTimerSettings
            quizId={quiz.id}
            initialIsTimed={Boolean(quiz.is_timed)}
            initialDurationMinutes={quiz.duration_minutes}
          />
        </div>
      ) : null}

      <Suspense
        fallback={
          <div className="rounded-2xl border border-border/70 bg-card p-6 text-sm text-muted-foreground shadow-sm">
            جاري تحميل إدارة الأسئلة...
          </div>
        }
      >
        <QuizQuestionsDashboard
          quizId={id}
          quizTitle={quiz.title}
          questions={questions}
        />
      </Suspense>
    </div>
  );
}
