"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { submitQuiz } from "@/actions/quiz";
import { useStudentLoadingBarSync } from "@/components/layout/StudentPortalShell";
import { OfflineStatusBanner } from "@/components/quiz/OfflineStatusBanner";
import { QuizPlayerHeader } from "@/components/quiz/QuizPlayerHeader";
import { QuizExitDialog } from "@/components/quiz/QuizExitDialog";
import { QuizSubmitDialog } from "@/components/quiz/QuizSubmitDialog";
import { QuestionPager } from "@/components/quiz/QuestionPager";
import { QuizProgressBar } from "@/components/quiz/QuizProgressBar";
import { QuestionJumpSheet } from "@/components/quiz/QuestionJumpSheet";
import type { ExamQuestion, Quiz, QuizSubmitResult } from "@/types/database";
import { QuestionCard } from "@/components/quiz/QuestionCard";
import { WhatsAppShare } from "@/components/quiz/WhatsAppShare";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  AlertCircle,
  CheckCircle2,
  CloudUpload,
  Flag,
  HelpCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toUserMessage, uiMessage, ErrorCode } from "@/lib/app-errors";
import { useOnlineStatus } from "@/lib/offline/connectivity";
import {
  getInProgress,
  saveInProgress,
  saveInProgressDebounced,
  clearInProgress,
} from "@/lib/offline/in-progress";
import {
  answeredProgress,
  isQuizComplete,
  isStaleInProgressDraft,
  QUIZ_AUTO_ADVANCE_MS,
  remainingUnanswered,
  shouldConfirmQuizExit,
} from "@/lib/quiz-player";
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
import { hapticPulse } from "@/lib/haptic";
import { SPEKIT, spekit } from "@/lib/spekit-targets";

const TIME_EXPIRED_NOTICE =
  "انتهى الوقت المحدد للاختبار! جاري تسليم إجاباتك تلقائياً...";

interface QuizRunnerProps {
  quiz: Quiz;
  questions: ExamQuestion[];
  initialResults?: QuizSubmitResult | null;
  teacherId: string;
  timer?: TimedQuizSessionView | null;
  usedAttempts?: number;
}

export function QuizRunner({
  quiz,
  questions,
  initialResults,
  teacherId,
  timer = null,
  usedAttempts = 0,
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
  const [exitOpen, setExitOpen] = useState(false);
  const [submitConfirmOpen, setSubmitConfirmOpen] = useState(false);
  const [jumpOpen, setJumpOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  useStudentLoadingBarSync(isPending);
  const router = useRouter();

  const autoSubmitStarted = useRef(false);
  const advanceTimer = useRef<number | null>(null);
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

      if (pending) {
        setPendingSync(true);
        setAnswers(pending.answers);
      } else if (draft) {
        if (
          isStaleInProgressDraft({
            usedAttempts,
            draftUsedAttemptsAtStart: draft.usedAttemptsAtStart,
            hasPendingSubmission: false,
          })
        ) {
          await clearInProgress(quiz.id);
          if (cancelled) return;
          setAnswers({});
          setActiveIndex(0);
        } else {
          setAnswers(draft.answers);
          if (typeof draft.activeIndex === "number") {
            setActiveIndex(draft.activeIndex);
          }
        }
      }

      setDraftReady(true);
    }

    void restoreState();

    return () => {
      cancelled = true;
    };
  }, [quiz.id, usedAttempts]);

  useEffect(() => {
    if (results || pendingSync) return;
    if (!draftReady) return;
    saveInProgressDebounced(quiz.id, {
      answers,
      activeIndex,
      usedAttemptsAtStart: usedAttempts,
    });
  }, [answers, activeIndex, quiz.id, results, pendingSync, draftReady, usedAttempts]);

  const isSubmitted = results !== null;
  const timeLocked = Boolean(timer) && remainingSeconds <= 0 && !isSubmitted;
  const questionIds = questions.map((q) => q.id);
  const remaining = remainingUnanswered({ answers, questionIds });
  const complete = isQuizComplete({ answers, questionIds });
  const showTakingSubmit =
    !isSubmitted &&
    !pendingSync &&
    !timeLocked &&
    questions.length > 0;
  const answeredCount = questions.length - remaining;
  const { percent: progressPercent, label: progressLabel } = answeredProgress(
    answeredCount,
    questions.length
  );
  const confirmExit = shouldConfirmQuizExit({
    isSubmitted,
    pendingSync,
    questionCount: questions.length,
    timeExpiredNotice,
  });

  const activeQuestion = questions[activeIndex];
  const activeResult = results?.answers.find(
    (a) => a.questionId === activeQuestion?.id
  );

  const handleAnswer = (questionId: string, value: string) => {
    if (isSubmitted || pendingSync || timeLocked) return;
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
    hapticPulse(10);

    if (advanceTimer.current) {
      window.clearTimeout(advanceTimer.current);
      advanceTimer.current = null;
    }
    if (activeIndex >= questions.length - 1) return;
    const nextIndex = activeIndex + 1;
    advanceTimer.current = window.setTimeout(() => {
      advanceTimer.current = null;
      goToQuestion(nextIndex);
    }, QUIZ_AUTO_ADVANCE_MS);
  };

  const submitAttempt = (opts: {
    forceTimedExpiry: boolean;
    allowIncomplete?: boolean;
  }) => {
    if (questions.length === 0) {
      setError(uiMessage(ErrorCode.QUIZ_EMPTY));
      return;
    }

    const payload =
      opts.forceTimedExpiry || opts.allowIncomplete
        ? padAnswersForQuestions(questionIds, answersRef.current)
        : answersRef.current;

    if (
      !opts.forceTimedExpiry &&
      !opts.allowIncomplete &&
      Object.keys(payload).length < questions.length
    ) {
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
        await clearInProgress(quiz.id);
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
    setSubmitConfirmOpen(false);
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
    if (isPending || !complete) return;
    hapticPulse(20);
    setSubmitConfirmOpen(true);
  };

  const handleSubmitConfirm = () => {
    setSubmitConfirmOpen(false);
    submitAttempt({
      forceTimedExpiry: false,
    });
  };

  useEffect(() => {
    if (timeLocked || timeExpiredNotice) {
      setSubmitConfirmOpen(false);
    }
  }, [timeLocked, timeExpiredNotice]);

  useEffect(() => {
    return () => {
      if (advanceTimer.current) window.clearTimeout(advanceTimer.current);
    };
  }, []);

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
    if (advanceTimer.current) {
      window.clearTimeout(advanceTimer.current);
      advanceTimer.current = null;
    }
    setActiveIndex(Math.max(0, Math.min(index, questions.length - 1)));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  useEffect(() => {
    if (!confirmExit) return;
    const url = `${window.location.pathname}${window.location.search}`;
    window.history.pushState({ quizPlayerGuard: true }, "", url);
    const onPop = () => {
      window.history.pushState({ quizPlayerGuard: true }, "", url);
      setExitOpen(true);
    };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, [confirmExit, quiz.id]);

  const handleExitRequest = () => {
    if (confirmExit) {
      setExitOpen(true);
      return;
    }
    router.replace("/quizzes");
  };

  const handleExitConfirm = () => {
    void saveInProgress(quiz.id, {
      answers: answersRef.current,
      activeIndex,
      usedAttemptsAtStart: usedAttempts,
    }).finally(() => {
      setExitOpen(false);
      router.replace("/quizzes");
    });
  };

  const wrongAnswersCount = results
    ? results.totalQuestions - results.correctCount
    : 0;

  return (
    <div
      className="mx-auto max-w-3xl px-4 py-1.5 pb-4 md:py-4"
      {...spekit(SPEKIT.quizPage)}
    >
      <QuizPlayerHeader
        title={quiz.title}
        showTimer={Boolean(timer) && !isSubmitted}
        remainingSeconds={remainingSeconds}
        durationMinutes={timer?.durationMinutes}
        attemptSubmittedAt={isSubmitted ? results?.submittedAt : null}
        onExit={handleExitRequest}
        onOpenJump={
          questions.length > 0 && !pendingSync
            ? () => setJumpOpen(true)
            : undefined
        }
      />
      <QuizExitDialog
        open={exitOpen}
        onOpenChange={setExitOpen}
        onConfirm={handleExitConfirm}
      />
      <QuizSubmitDialog
        open={submitConfirmOpen}
        onOpenChange={setSubmitConfirmOpen}
        onConfirm={handleSubmitConfirm}
      />
      <QuestionJumpSheet
        open={jumpOpen}
        onOpenChange={setJumpOpen}
        count={questions.length}
        activeIndex={activeIndex}
        isSubmitted={isSubmitted}
        answers={answers}
        questionIds={questionIds}
        results={results}
        onNavigate={goToQuestion}
      />

      {!online && !isSubmitted && !pendingSync && <OfflineStatusBanner />}

      {error && !isSubmitted && !timeLocked && !timeExpiredNotice ? (
        <div
          role="alert"
          className="mb-3 flex items-start gap-2 rounded-xl border border-red-100 bg-red-50 px-4 py-2.5 text-xs text-red-700"
        >
          <AlertCircle className="mt-0.5 size-4 shrink-0" />
          <span className="font-bold">{error}</span>
        </div>
      ) : null}

      {timeExpiredNotice && !isSubmitted ? (
        <div
          role="status"
          className="mb-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-center text-sm font-extrabold text-rose-800"
        >
          {TIME_EXPIRED_NOTICE}
        </div>
      ) : null}

      <main className="space-y-4" {...spekit(SPEKIT.quizQuestionList)}>
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
              className="border-dashed border-border"
              {...spekit(SPEKIT.quizEmptyState)}
            >
              <CardContent className="space-y-3 p-8 text-center">
                <AlertCircle className="mx-auto size-8 text-muted-foreground" />
                <p className="text-sm font-semibold text-foreground">
                  هذا الاختبار فاضي — ما في أسئلة بعد
                </p>
                <p className="text-xs leading-relaxed text-muted-foreground">
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
                {activeQuestion ? (
                  <div
                    key={activeQuestion.id}
                    className="quiz-question-enter w-full"
                  >
                    <QuestionCard
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
                      correctAnswer={
                        isSubmitted ? activeResult?.correctAnswer : undefined
                      }
                      categoryTag={
                        isSubmitted ? activeResult?.categoryTag : undefined
                      }
                      explanationText={
                        isSubmitted ? activeResult?.explanationText : undefined
                      }
                      explanationMediaUrl={
                        isSubmitted
                          ? activeResult?.explanationMediaUrl
                          : undefined
                      }
                      header={
                        <div className="flex w-full flex-col items-stretch gap-2">
                          <div
                            dir="ltr"
                            className="flex w-full items-center gap-2"
                          >
                            {showTakingSubmit ? (
                              <Button
                                size="sm"
                                className={cn(
                                  "min-h-11 shrink-0 gap-1 rounded-xl px-3",
                                  "text-sm font-extrabold",
                                  "bg-brand-600 text-white shadow-sm transition-all hover:bg-brand-700",
                                  "hover:scale-[1.01] active:scale-[0.99]",
                                  "disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:scale-100"
                                )}
                                onClick={handleSubmit}
                                disabled={!complete || isPending}
                                {...spekit(SPEKIT.quizSubmitButton)}
                              >
                                {isPending ? (
                                  online ? (
                                    "جاري التسليم..."
                                  ) : (
                                    "جاري الحفظ..."
                                  )
                                ) : (
                                  <>
                                    <Flag className="size-3.5" aria-hidden />
                                    تسليم
                                  </>
                                )}
                              </Button>
                            ) : null}
                            <QuestionPager
                              count={questions.length}
                              activeIndex={activeIndex}
                              isSubmitted={isSubmitted}
                              answers={answers}
                              questionIds={questionIds}
                              results={results}
                              onNavigate={goToQuestion}
                              compact={showTakingSubmit}
                              className={
                                showTakingSubmit ? "ms-auto" : "mx-auto"
                              }
                            />
                          </div>
                          <QuizProgressBar
                            percent={progressPercent}
                            label={progressLabel}
                          />
                        </div>
                      }
                    />
                  </div>
                ) : null}
              </>
            )
          )}

          {isSubmitted && results && (
            <div
              className="space-y-6 animate-slide-up"
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
                        استخدم أرقام الأسئلة لمراجعة الإجابات الخاطئة — الشروحات
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
