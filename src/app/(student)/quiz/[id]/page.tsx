import { notFound, redirect } from "next/navigation";
import {
  getQuizForStudent,
  getSubmissionResults,
} from "@/actions/quiz";
import { QuizRunner } from "@/components/quiz/QuizRunner";
import { buttonVariants } from "@/components/ui/button";
import { ArrowRight, AlertCircle } from "lucide-react";
import { SPEKIT } from "@/lib/spekit-targets";
import { AppError, ErrorCode, toUserMessage } from "@/lib/app-errors";

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

  const initialResults = existingSubmissionId
    ? await getSubmissionResults(existingSubmissionId)
    : null;

  return (
    <div data-spekit={SPEKIT.quizPage}>
      <QuizRunner
        quiz={quiz}
        questions={questions}
        initialResults={initialResults}
      />
    </div>
  );
}
