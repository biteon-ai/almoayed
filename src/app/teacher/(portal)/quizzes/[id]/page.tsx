import { getQuizQuestions, getTeacherQuizById } from "@/actions/teacher";
import { QuizQuestionsDashboard } from "@/components/teacher/QuizQuestionsDashboard";
import { QuizEditSettingsPanel } from "@/components/teacher/QuizEditSettingsPanel";
import { QuizTrashBanner } from "@/components/teacher/QuizTrashBanner";
import { EditQuizImportToast } from "@/components/teacher/EditQuizImportToast";
import { PageLoadingView } from "@/components/ui/page-loading-view";
import { SPEKIT } from "@/lib/spekit-targets";
import { notFound } from "next/navigation";
import { Suspense } from "react";

export const metadata = { title: "تحرير الاختبار" };

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
        <QuizEditSettingsPanel
          quizId={quiz.id}
          quizTitle={quiz.title}
          initialIsTimed={Boolean(quiz.is_timed)}
          initialDurationMinutes={quiz.duration_minutes}
          initialCategory={quiz.assessment_category ?? "evaluation"}
          initialMaxAttempts={quiz.max_attempts ?? 1}
        />
      ) : null}

      <Suspense
        fallback={
          <PageLoadingView
            message="جاري تحميل إدارة الأسئلة..."
            subMessage="نحضّر الأسئلة والإعدادات"
          />
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
