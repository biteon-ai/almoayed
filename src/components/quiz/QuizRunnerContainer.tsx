"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { AlertCircle } from "lucide-react";
import { QuizRunner } from "@/components/quiz/QuizRunner";
import { buttonVariants } from "@/components/ui/button-variants";
import { useOnlineStatus } from "@/lib/offline/connectivity";
import { getQuizPackage, saveQuizPackage } from "@/lib/offline/quiz-cache";
import type { TimedQuizSessionView } from "@/lib/quiz-timer";
import { formatAttemptProgressAr } from "@/lib/quiz-attempts";
import { SPEKIT, spekit } from "@/lib/spekit-targets";
import type {
  ExamQuestion,
  Quiz,
  QuizAttemptState,
  QuizSubmitResult,
} from "@/types/database";

interface QuizRunnerContainerProps {
  teacherId: string;
  quiz: Quiz;
  questions: ExamQuestion[];
  initialResults?: QuizSubmitResult | null;
  timer?: TimedQuizSessionView | null;
  attemptState?: QuizAttemptState;
}

export function QuizRunnerContainer({
  teacherId,
  quiz,
  questions,
  initialResults,
  timer = null,
  attemptState,
}: QuizRunnerContainerProps) {
  const params = useParams();
  const quizId = (params.id as string) ?? quiz.id;
  const online = useOnlineStatus();
  const [loadedQuiz, setLoadedQuiz] = useState(quiz);
  const [loadedQuestions, setLoadedQuestions] = useState(questions);
  const [loadedResults, setLoadedResults] = useState(initialResults ?? null);
  const [loadedTimer, setLoadedTimer] = useState<TimedQuizSessionView | null>(
    timer
  );
  const [unavailable, setUnavailable] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function hydrate() {
      if (quiz && questions.length > 0) {
        if (online) {
          await saveQuizPackage({ quiz, questions, teacherId, timer });
        }
        if (!cancelled) {
          setLoadedQuiz(quiz);
          setLoadedQuestions(questions);
          setLoadedResults(initialResults ?? null);
          setLoadedTimer(timer);
          setUnavailable(false);
          setHydrated(true);
        }
        return;
      }

      if (!online) {
        const pkg = await getQuizPackage(quizId);
        if (cancelled) return;

        if (pkg) {
          setLoadedQuiz(pkg.quiz);
          setLoadedQuestions(pkg.questions);
          setLoadedResults(null);
          setLoadedTimer(pkg.timer ?? null);
          setUnavailable(false);
        } else {
          setUnavailable(true);
        }
        setHydrated(true);
        return;
      }

      if (!cancelled) {
        setHydrated(true);
      }
    }

    void hydrate();

    return () => {
      cancelled = true;
    };
  }, [quiz, questions, initialResults, online, quizId, teacherId, timer]);

  if (!hydrated) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center px-6">
        <p className="text-sm font-bold text-slate-500">جاري تحميل الاختبار...</p>
      </div>
    );
  }

  if (unavailable) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 px-6 text-center">
        <AlertCircle className="size-10 text-amber-600" aria-hidden />
        <p className="max-w-sm text-sm font-bold text-foreground" role="alert">
          هذا الاختبار غير متاح بدون اتصال. اتصل بالإنترنت وافتح الاختبار مرة
          واحدة على الأقل، ثم يمكنك إكماله لاحقاً بدون شبكة.
        </p>
        <Link href="/dashboard" className={buttonVariants({ variant: "outline" })}>
          رجوع للرئيسية
        </Link>
      </div>
    );
  }

  return (
    <>
      {attemptState?.canStartNewAttempt &&
      attemptState.usedAttempts > 0 &&
      attemptState.maxAttempts > 0 ? (
        <div
          className="border-b border-emerald-200/60 bg-emerald-50/80 px-4 py-2 text-center text-xs font-bold text-emerald-800"
          {...spekit(SPEKIT.quizAttemptBadge)}
        >
          {formatAttemptProgressAr(
            attemptState.usedAttempts,
            attemptState.maxAttempts
          )}
        </div>
      ) : null}
      {!attemptState?.canStartNewAttempt && attemptState?.usedAttempts ? (
        <div className="border-b border-amber-200/60 bg-amber-50/80 px-4 py-2 text-center text-xs font-bold text-amber-800">
          انتهت المحاولات المتاحة — هذه مراجعة لنتيجتك الأخيرة.
        </div>
      ) : null}
      <QuizRunner
        quiz={loadedQuiz}
        questions={loadedQuestions}
        initialResults={loadedResults}
        teacherId={teacherId}
        timer={loadedResults ? null : loadedTimer}
      />
    </>
  );
}
