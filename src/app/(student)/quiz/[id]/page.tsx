import { notFound, redirect } from "next/navigation";
import {
  getQuizForStudent,
  getSubmissionResults,
} from "@/actions/quiz";
import {
  countUniqueCompletedQuizzes,
  getStudentProfileState,
} from "@/actions/profile";
import { QuizRunnerContainer } from "@/components/quiz/QuizRunnerContainer";
import { buttonVariants } from "@/components/ui/button-variants";
import { ArrowRight, AlertCircle } from "lucide-react";
import { SPEKIT } from "@/lib/spekit-targets";
import { shouldBlockNewQuiz } from "@/lib/student-profile";
import { AppError, ErrorCode, toUserMessage } from "@/lib/app-errors";
import { getActiveTeacherId, requireStudent } from "@/lib/auth";

interface QuizPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: QuizPageProps) {
  const { id } = await params;
  try {
    const { quiz } = await getQuizForStudent(id);
    return {
      title: quiz ? `${quiz.title} | المؤيد` : "اختبار | المؤيد",
    };
  } catch {
    return { title: "اختبار | المؤيد" };
  }
}

export default async function QuizPage({ params }: QuizPageProps) {
  const { id } = await params;
  const session = await requireStudent();
  const teacherId =
    session.currentTeacherId ?? (await getActiveTeacherId(session)) ?? "";

  let data;
  let accessError: string | null = null;

  try {
    data = await getQuizForStudent(id);
  } catch (e) {
    if (e instanceof AppError && e.code === ErrorCode.SUBSCRIPTION_REQUIRED) {
      redirect("/login");
    }
    accessError = toUserMessage(e);
  }

  if (accessError) {
    return (
      <div
        className="flex min-h-[60vh] flex-col items-center justify-center gap-4 px-6 text-center"
        data-spekit={SPEKIT.quizPage}
      >
        <AlertCircle className="size-10 text-destructive" aria-hidden />
        <p className="max-w-sm text-sm font-bold text-foreground" role="alert">
          {accessError}
        </p>
        <a href="/dashboard" className={buttonVariants({ variant: "outline" })}>
          <ArrowRight className="size-4" />
          رجوع للرئيسية
        </a>
      </div>
    );
  }

  const { quiz, questions, existingSubmissionId } = data!;

  if (!quiz) {
    notFound();
  }

  const [profileState, uniqueCompletedQuizzes] = await Promise.all([
    getStudentProfileState(),
    countUniqueCompletedQuizzes(session.profileId),
  ]);

  if (
    shouldBlockNewQuiz({
      profileCompleted: profileState.profileCompleted,
      uniqueCompletedQuizzes,
      hasSubmissionForQuiz: Boolean(existingSubmissionId),
    })
  ) {
    redirect(`/profile/complete?from=${encodeURIComponent(`/quiz/${id}`)}`);
  }

  const initialResults = existingSubmissionId
    ? await getSubmissionResults(existingSubmissionId)
    : null;

  return (
    <div data-spekit={SPEKIT.quizPage}>
      <QuizRunnerContainer
        teacherId={teacherId}
        quiz={quiz}
        questions={questions}
        initialResults={initialResults}
      />
    </div>
  );
}
