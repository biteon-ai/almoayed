import { getQuizQuestions, resolveTeacherQuizParam } from "@/actions/teacher";
import { QuizQuestionsDashboard } from "@/components/teacher/QuizQuestionsDashboard";
import { QuizEditSettingsPanel } from "@/components/teacher/QuizEditSettingsPanel";
import { QuizTrashBanner } from "@/components/teacher/QuizTrashBanner";
import { EditQuizImportToast } from "@/components/teacher/EditQuizImportToast";
import { SPEKIT } from "@/lib/spekit-targets";
import { isQuizUuidParam, teacherQuizHref } from "@/lib/teacher-quiz-path";
import { notFound, permanentRedirect } from "next/navigation";
import { Suspense } from "react";

export const metadata = { title: "تحرير الاختبار | المؤيد" };

interface PageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

function queryStringFromSearchParams(
  searchParams: Record<string, string | string[] | undefined>
): string {
  const qs = new URLSearchParams();
  for (const [key, value] of Object.entries(searchParams)) {
    if (typeof value === "string" && value.length > 0) {
      qs.set(key, value);
    } else if (Array.isArray(value) && value[0]) {
      qs.set(key, value[0]);
    }
  }
  const serialized = qs.toString();
  return serialized ? `?${serialized}` : "";
}

export default async function EditQuizPage({ params, searchParams }: PageProps) {
  const { slug: rawParam } = await params;
  const param = rawParam.trim();
  const quiz = await resolveTeacherQuizParam(param);
  if (!quiz) notFound();

  if (isQuizUuidParam(param) && param.toLowerCase() !== quiz.slug.toLowerCase()) {
    const sp = await searchParams;
    permanentRedirect(
      `${teacherQuizHref(quiz.slug)}${queryStringFromSearchParams(sp)}`
    );
  }

  const questions = await getQuizQuestions(quiz.id);

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
          <div className="rounded-2xl border border-border/70 bg-card p-6 text-sm text-muted-foreground shadow-sm">
            جاري تحميل إدارة الأسئلة...
          </div>
        }
      >
        <QuizQuestionsDashboard
          quizId={quiz.id}
          quizSlug={quiz.slug}
          quizTitle={quiz.title}
          questions={questions}
        />
      </Suspense>
    </div>
  );
}
