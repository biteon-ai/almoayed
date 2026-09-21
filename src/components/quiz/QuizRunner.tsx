"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { submitQuiz } from "@/actions/quiz";
import { useStudentLoadingBarSync } from "@/components/layout/StudentPortalShell";
import { OfflineStatusBanner } from "@/components/quiz/OfflineStatusBanner";
import { QuizTimerBadge } from "@/components/quiz/QuizTimerBadge";
import type { ExamQuestion, Quiz, QuizSubmitResult } from "@/types/database";
import { QuestionCard } from "@/components/quiz/QuestionCard";
import { QuizSidebar } from "@/components/quiz/QuizSidebar";
import { WhatsAppShare } from "@/components/quiz/WhatsAppShare";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  AlertCircle,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  CloudUpload,
  HelpCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toUserMessage, uiMessage, ErrorCode } from "@/lib/app-errors";
import { useOnlineStatus } from "@/lib/offline/connectivity";
import {
  getInProgress,
  saveInProgressDebounced,
} from "@/lib/offline/in-progress";
import {
  enqueuePendingSubmission,
  getPendingForQuiz,
} from "@/lib/offline/pending-queue";
import { flushPendingSubmissions } from "@/lib/offline/sync-processor";
import {
  padAnswersForQuestions,
  remainingSecondsFromEndsAt,
  type TimedQuizSessionView,
} from "@/lib/quiz-timer";
import { SPEKIT, spekit } from "@/lib/spekit-targets";

const TIME_EXPIRED_NOTICE =
  "انتهى الوقت المحدد للاختبار! جاري تسليم إجاباتك تلقائياً...";

interface QuizRunnerProps {
  quiz: Quiz;
  questions: ExamQuestion[];
  initialResults?: QuizSubmitResult | null;
  teacherId: string;
  timer?: TimedQuizSessionView | null;
}

export function QuizRunner({
  quiz,
  questions,
  initialResults,
  teacherId,
  timer = null,
}: QuizRunnerProps) {
  const online = useOnlineStatus();
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [results, setResults] = useState<QuizSubmitResult | null>(
    initialResults ?? null
  );
  const [pendingSync, setPendingSync] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [timeExpiredNotice, setTimeExpiredNotice] = useState(false);
  const [remainingSeconds, setRemainingSeconds] = useState(() =>
    timer ? remainingSecondsFromEndsAt(timer.endsAt) : 0
  );
  const [draftReady, setDraftReady] = useState(false);
  const [isPending, startTransition] = useTransition();
  useStudentLoadingBarSync(isPending);

  const autoSubmitStarted = useRef(false);
  const answersRef = useRef(answers);
  answersRef.current = answers;

  useEffect(() => {
    if (!timer) return;
    setRemainingSeconds(remainingSecondsFromEndsAt(timer.endsAt));
    const id = window.setInterval(() => {
      setRemainingSeconds(remainingSecondsFromEndsAt(timer.endsAt));
    }, 1000);
    return () => window.clearInterval(id);
  }, [timer]);

  useEffect(() => {
    let cancelled = false;

    async function restoreState() {
      const [draft, pending] = await Promise.all([
        getInProgress(quiz.id),
        getPendingForQuiz(quiz.id),
      ]);

      if (cancelled) return;

      if (draft?.answers) {
        setAnswers(draft.answers);
        if (typeof draft.activeIndex === "number") {
          setActiveIndex(draft.activeIndex);
        }
      }

      if (pending) {
        setPendingSync(true);
        setAnswers(pending.answers);
      }

      setDraftReady(true);
    }

    void restoreState();

    return () => {
      cancelled = true;
    };
  }, [quiz.id]);

  useEffect(() => {
    if (results || pendingSync) return;
    if (!draftReady) return;
    saveInProgressDebounced(quiz.id, { answers, activeIndex });
  }, [answers, activeIndex, quiz.id, results, pendingSync, draftReady]);

  const isSubmitted = results !== null;
  const timeLocked = Boolean(timer) && remainingSeconds <= 0 && !isSubmitted;
  const answeredCount = Object.keys(answers).length;
  const progress = questions.length
    ? (answeredCount / questions.length) * 100
    : 0;
  const questionIds = questions.map((q) => q.id);

  const activeQuestion = questions[activeIndex];
  const activeResult = results?.answers.find(
    (a) => a.questionId === activeQuestion?.id
  );

  const handleAnswer = (questionId: string, value: string) => {
    if (isSubmitted || pendingSync || timeLocked) return;
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
  };

  const submitAttempt = (opts: { forceTimedExpiry: boolean }) => {
    if (questions.length === 0) {
      setError(uiMessage(ErrorCode.QUIZ_EMPTY));
      return;
    }

    const payload = opts.forceTimedExpiry
      ? padAnswersForQuestions(questionIds, answersRef.current)
      : answersRef.current;

    if (!opts.forceTimedExpiry && Object.keys(payload).length < questions.length) {
      setError("يرجى الإجابة على جميع الأسئلة قبل تسليم الاختبار.");
      return;
    }

    setError(null);
    if (opts.forceTimedExpiry) {
      setTimeExpiredNotice(true);
      setAnswers(payload);
    }

    startTransition(async () => {
      if (!online) {
        await enqueuePendingSubmission({
          quizId: quiz.id,
          teacherId,
          answers: payload,
          questionIds,
          sessionExpiredAtSubmit: opts.forceTimedExpiry,
        });
        setPendingSync(true);
        window.scrollTo({ top: 0, behavior: "smooth" });
        return;
      }

      try {
        const result = await submitQuiz(quiz.id, payload);
        setResults(result);
        setPendingSync(false);
        setTimeExpiredNotice(false);
        window.scrollTo({ top: 0, behavior: "smooth" });
      } catch (e) {
        setError(toUserMessage(e, "صار خطأ أثناء تسليم الإجابات."));
        autoSubmitStarted.current = false;
      }
    });
  };

  useEffect(() => {
    if (!timer || isSubmitted || pendingSync || !draftReady) return;
    if (remainingSeconds > 0) return;
    if (autoSubmitStarted.current) return;
    if (questions.length === 0) return;

    autoSubmitStarted.current = true;
    submitAttempt({ forceTimedExpiry: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- fire once on expiry after draft restore
  }, [
    timer,
    remainingSeconds,
    isSubmitted,
    pendingSync,
    questions.length,
    draftReady,
  ]);

  const handleSubmit = () => {
    submitAttempt({ forceTimedExpiry: false });
  };

  const handleRetrySync = () => {
    startTransition(async () => {
      try {
        await flushPendingSubmissions();
        const result = await submitQuiz(
          quiz.id,
          padAnswersForQuestions(questionIds, answersRef.current)
        );
        setResults(result);
        setPendingSync(false);
      } catch (e) {
        setError(toUserMessage(e, "تعذرت مزامنة المحاولة. جرّب مرة تانية."));
      }
    });
  };

  const goToQuestion = (index: number) => {
    setActiveIndex(Math.max(0, Math.min(index, questions.length - 1)));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const wrongAnswersCount = results
    ? results.totalQuestions - results.correctCount
    : 0;

  return (
    <div
      className="mx-auto max-w-7xl px-4 py-6 pb-36 md:py-8 md:pb-24"
      {...spekit(SPEKIT.quizPage)}
    >
      {timer && !isSubmitted ? (
        <QuizTimerBadge remainingSeconds={remainingSeconds} />
      ) : null}

      {!online && !isSubmitted && !pendingSync && <OfflineStatusBanner />}

      {timeExpiredNotice && !isSubmitted ? (
        <div
          role="status"
          className="mb-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-center text-sm font-extrabold text-rose-800"
        >
          {TIME_EXPIRED_NOTICE}
        </div>
      ) : null}

      <div className="grid grid-cols-1 gap-6 md:grid-cols-12 md:gap-8">
        <main
          className="order-2 space-y-6 md:order-1 md:col-span-8 lg:col-span-8"
          {...spekit(SPEKIT.quizQuestionList)}
        >
          {pendingSync && !isSubmitted && (
            <Card
              className="border-teal-200 bg-teal-50/80"
              {...spekit(SPEKIT.quizPendingSync)}
            >
              <CardContent className="space-y-3 p-6 text-center">
                <CloudUpload className="mx-auto size-8 text-teal-700" />
                <p className="text-sm font-extrabold text-teal-900">
                  تم حفظ محاولتك على هذا الجهاز
                </p>
                <p className="text-xs leading-relaxed text-teal-800/90">
                  ستُرسل إجاباتك تلقائياً عند عودة الاتصال. النتيجة والشروحات
                  ستظهر بعد قبول الخادم للمحاولة.
                </p>
                {online && (
                  <Button
                    type="button"
                    variant="outline"
                    className="h-11 font-bold"
                    onClick={handleRetrySync}
                    disabled={isPending}
                    data-spekit={SPEKIT.offlineSyncNow}
                  >
                    مزامنة الآن
                  </Button>
                )}
              </CardContent>
            </Card>
          )}

          {questions.length === 0 ? (
            <Card
              className="border-dashed border-slate-200"
              {...spekit(SPEKIT.quizEmptyState)}
            >
              <CardContent className="space-y-3 p-8 text-center">
                <AlertCircle className="mx-auto size-8 text-slate-400" />
                <p className="text-sm font-semibold text-slate-800">
                  هذا الاختبار فاضي — ما في أسئلة بعد
                </p>
                <p className="text-xs leading-relaxed text-slate-500">
                  الأستاذ لسه ما أضاف أسئلة. ارجع للوحة التحكم وجرب لاحقاً.
                </p>
                <Link href="/dashboard">
                  <Button variant="outline" className="mt-2 h-11">
                    العودة للوحة التحكم
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ) : (
            !pendingSync && (
              <>
                <div className="mx-auto w-full max-w-3xl">
                  {activeQuestion && (
                    <QuestionCard
                      key={activeQuestion.id}
                      question={activeQuestion}
                      index={activeIndex}
                      value={
                        isSubmitted
                          ? activeResult?.studentAnswer
                          : answers[activeQuestion.id]
                      }
                      onChange={(v) => handleAnswer(activeQuestion.id, v)}
                      disabled={isSubmitted || timeLocked}
                      showResult={isSubmitted}
                      correctAnswer={activeResult?.correctAnswer}
                      categoryTag={activeResult?.categoryTag}
                      explanationText={activeResult?.explanationText}
                      explanationMediaUrl={activeResult?.explanationMediaUrl}
                    />
                  )}
                </div>

                <div className="mx-auto flex max-w-3xl items-center justify-between gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-10 gap-1 rounded-xl font-bold"
                    disabled={activeIndex === 0}
                    onClick={() => goToQuestion(activeIndex - 1)}
                  >
                    <ChevronRight className="size-4" />
                    السابق
                  </Button>
                  <span className="text-xs font-bold tabular-nums text-slate-500">
                    {activeIndex + 1} / {questions.length}
                  </span>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-10 gap-1 rounded-xl font-bold"
                    disabled={activeIndex >= questions.length - 1}
                    onClick={() => goToQuestion(activeIndex + 1)}
                  >
                    التالي
                    <ChevronLeft className="size-4" />
                  </Button>
                </div>
              </>
            )
          )}

          {isSubmitted && results && (
            <div
              className="mx-auto max-w-3xl space-y-6 animate-slide-up"
              {...spekit(SPEKIT.quizResultsReview)}
            >
              <WhatsAppShare
                score={results.score}
                quizId={quiz.id}
                quizTitle={quiz.title}
                correctCount={results.correctCount}
                totalQuestions={results.totalQuestions}
              />

              {wrongAnswersCount > 0 ? (
                <Card className="border-amber-100 bg-amber-50/50">
                  <CardContent className="flex items-start gap-3 p-5">
                    <HelpCircle className="mt-0.5 size-6 shrink-0 text-amber-600" />
                    <div className="text-start">
                      <h3 className="text-sm font-bold text-amber-900">
                        راجع تفاصيل الأخطاء
                      </h3>
                      <p className="mt-1 text-xs leading-relaxed text-amber-800/90">
                        استخدم شبكة التنقل لمراجعة الأسئلة الخاطئة — الشروحات
                        مفتوحة لكل سؤال.
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <Card className="border-green-100 bg-green-50/50">
                  <CardContent className="flex items-center gap-3.5 p-5 text-start">
                    <div className="flex size-9 items-center justify-center rounded-full bg-green-100">
                      <CheckCircle2 className="size-5 text-green-600" />
                    </div>
                    <div>
                      <h3 className="text-sm font-extrabold text-green-900">
                        علامة كاملة، فخورين فيك!
                      </h3>
                      <p className="mt-0.5 text-xs text-green-800/80">
                        أحسنت جداً! لقد أجبت على جميع الأسئلة بشكل صحيح.
                      </p>
                    </div>
                  </CardContent>
                </Card>
              )}

              <Link href="/dashboard" className="block">
                <Button
                  variant="outline"
                  className="h-12 w-full rounded-2xl border-border/60 font-bold hover:bg-muted/60"
                >
                  العودة للوحة التحكم
                </Button>
              </Link>
            </div>
          )}
        </main>

        <QuizSidebar
          className="order-1 md:order-2 md:col-span-4 lg:col-span-4"
          quiz={quiz}
          questionCount={questions.length}
          questionIds={questionIds}
          answeredCount={answeredCount}
          progress={progress}
          isSubmitted={isSubmitted || pendingSync || timeLocked}
          activeIndex={activeIndex}
          answers={answers}
          results={results}
          onNavigate={goToQuestion}
        />
      </div>

      {!isSubmitted && !pendingSync && !timeLocked && questions.length > 0 && (
        <div className="fixed inset-x-0 bottom-16 z-40 border-t border-slate-100 bg-white/90 p-4 shadow-lg backdrop-blur-md safe-bottom md:bottom-0 md:z-30">
          <div className="mx-auto max-w-3xl space-y-3">
            {error && (
              <div
                role="alert"
                className="flex items-start gap-2 rounded-xl border border-red-100 bg-red-50 px-4 py-2.5 text-xs text-red-700"
              >
                <AlertCircle className="mt-0.5 size-4 shrink-0" />
                <span className="font-bold">{error}</span>
              </div>
            )}
            <Button
              size="lg"
              className={cn(
                "h-12 w-full rounded-xl text-base font-extrabold",
                "bg-brand-600 text-white shadow-md transition-all hover:bg-brand-700",
                "hover:scale-[1.01] active:scale-[0.99]",
                "disabled:opacity-50 disabled:hover:scale-100"
              )}
              onClick={handleSubmit}
              disabled={isPending}
              {...spekit(SPEKIT.quizSubmitButton)}
            >
              {isPending
                ? online
                  ? "جاري تسليم الإجابات وحساب النتيجة..."
                  : "جاري حفظ المحاولة على الجهاز..."
                : online
                  ? "تسليم الإجابات وإنهاء الاختبار 🏁"
                  : "حفظ المحاولة للمزامنة لاحقاً 📥"}
            </Button>
          </div>
        </div>
      )}

      {error && (timeLocked || timeExpiredNotice) && !isSubmitted ? (
        <div
          role="alert"
          className="fixed inset-x-0 bottom-16 z-40 mx-auto max-w-3xl px-4 md:bottom-4"
        >
          <div className="flex items-start gap-2 rounded-xl border border-red-100 bg-red-50 px-4 py-2.5 text-xs text-red-700 shadow-lg">
            <AlertCircle className="mt-0.5 size-4 shrink-0" />
            <span className="font-bold">{error}</span>
          </div>
        </div>
      ) : null}
    </div>
  );
}
