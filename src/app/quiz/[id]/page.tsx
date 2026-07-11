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
        className="flex min-h-dvh flex-col items-center justify-center gap-4 px-6 text-center"
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
    <div
      className="min-h-dvh bg-gradient-to-b from-brand-50/30 to-background dark:from-brand-950/20"
      data-spekit={SPEKIT.quizPage}
    >
      <nav className="sticky top-0 z-20 border-b bg-background/80 backdrop-blur-sm">
        <div className="mx-auto flex max-w-lg items-center px-4 py-3">
          <a
            href="/dashboard"
            className={buttonVariants({ variant: "ghost", size: "sm" })}
          >
            <ArrowRight className="size-4" />
            رجوع
          </a>
        </div>
      </nav>

      <QuizRunner
        quiz={quiz}
        questions={questions}
        initialResults={initialResults}
      />
    </div>
  );
}
