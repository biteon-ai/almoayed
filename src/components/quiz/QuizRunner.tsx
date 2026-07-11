"use client";

import { useState, useTransition } from "react";
import { submitQuiz } from "@/actions/quiz";
import type { ExamQuestion, Quiz, QuizSubmitResult } from "@/types/database";
import { QuestionCard } from "@/components/quiz/QuestionCard";
import { WhatsAppShare } from "@/components/quiz/WhatsAppShare";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent } from "@/components/ui/card";
import { Lock, Unlock, AlertCircle, CheckCircle2, ChevronRight, HelpCircle } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { toUserMessage, uiMessage, ErrorCode } from "@/lib/app-errors";
import { SPEKIT, spekit } from "@/lib/spekit-targets";

interface QuizRunnerProps {
  quiz: Quiz;
  questions: ExamQuestion[];
  initialResults?: QuizSubmitResult | null;
}

export function QuizRunner({
  quiz,
  questions,
  initialResults,
}: QuizRunnerProps) {
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [results, setResults] = useState<QuizSubmitResult | null>(
    initialResults ?? null
  );
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const isSubmitted = results !== null;
  const answeredCount = Object.keys(answers).length;
  const progress = questions.length
    ? (answeredCount / questions.length) * 100
    : 0;

  const handleAnswer = (questionId: string, value: string) => {
    if (isSubmitted) return;
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
  };

  const handleSubmit = () => {
    if (questions.length === 0) {
      setError(uiMessage(ErrorCode.QUIZ_EMPTY));
      return;
    }
    if (answeredCount < questions.length) {
      setError("يرجى الإجابة على جميع الأسئلة قبل تسليم الاختبار.");
      return;
    }
    setError(null);

    startTransition(async () => {
      try {
        const result = await submitQuiz(quiz.id, answers);
        setResults(result);
        window.scrollTo({ top: 0, behavior: "smooth" });
      } catch (e) {
        setError(toUserMessage(e, "صار خطأ أثناء تسليم الإجابات."));
      }
    });
  };

  const wrongAnswersCount = results ? results.totalQuestions - results.correctCount : 0;

  return (
    <div className="mx-auto max-w-lg space-y-6 px-4 py-5 pb-28 animate-fade-in" {...spekit(SPEKIT.quizPage)}>
      {/* Navigation Top strip */}
      <div className="flex items-center justify-between">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-1 text-xs font-bold text-muted-foreground hover:text-brand-700 transition-colors"
        >
          <ChevronRight className="size-4" />
          <span>العودة للرئيسية</span>
        </Link>
        <span className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-widest">المؤيد للرياضيات</span>
      </div>

      {/* Quiz Progress & Gatekeeper State Card */}
      <Card
        className="border-brand-100/60 dark:border-brand-900/30 overflow-hidden bg-white/50 dark:bg-card/40 backdrop-blur-md"
        {...spekit(SPEKIT.quizGatekeeper)}
      >
        <CardContent className="p-4 space-y-3.5">
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-1">
              <h1 className="text-lg font-extrabold text-foreground text-start leading-tight">
                {quiz.title}
              </h1>
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-semibold">
                {isSubmitted ? (
                  <>
                    <Unlock className="size-3.5 text-green-600 dark:text-green-500" />
                    <span className="text-green-600 dark:text-green-500">تم فتح الحلول والشرح العلمي</span>
                  </>
                ) : (
                  <>
                    <Lock className="size-3.5 text-amber-600" />
                    <span>الحلول مقفلة حتى ترسل إجاباتك</span>
                  </>
                )}
              </div>
            </div>
            
            {/* Answer count pill */}
            <div className="shrink-0 bg-brand-50 text-brand-800 text-xs font-bold px-3 py-1.5 rounded-full border border-brand-100/80 dark:bg-brand-950/40 dark:text-brand-300 dark:border-brand-900/40">
              {questions.length} أسئلة
            </div>
          </div>

          {/* Progress bar */}
          {!isSubmitted && (
            <div className="space-y-1.5 pt-1" {...spekit(SPEKIT.quizProgress)}>
              <div className="flex justify-between text-[11px] font-bold text-muted-foreground">
                <span>الأسئلة المحلولة: {answeredCount} من {questions.length}</span>
                <span className="font-mono">{Math.round(progress)}%</span>
              </div>
              <Progress value={progress} className="h-2 bg-brand-100/40 dark:bg-brand-950/20" />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Questions list */}
      <div className="space-y-5" {...spekit(SPEKIT.quizQuestionList)}>
        {questions.length === 0 ? (
          <Card className="border-dashed border-border/80" {...spekit(SPEKIT.quizEmptyState)}>
            <CardContent className="space-y-3 p-6 text-center">
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
          questions.map((q, idx) => {
            const resultAnswer = results?.answers.find(
              (a) => a.questionId === q.id
            );
            return (
              <QuestionCard
                key={q.id}
                question={q}
                index={idx}
                value={
                  isSubmitted
                    ? resultAnswer?.studentAnswer
                    : answers[q.id]
                }
                onChange={(v) => handleAnswer(q.id, v)}
                disabled={isSubmitted}
                showResult={isSubmitted}
                correctAnswer={resultAnswer?.correctAnswer}
                categoryTag={resultAnswer?.categoryTag}
                explanationText={resultAnswer?.explanationText}
                explanationMediaUrl={resultAnswer?.explanationMediaUrl}
              />
            );
          })
        )}
      </div>

      {/* Post-submission Review and WhatsApp Share */}
      {isSubmitted && (
        <div className="space-y-6 pt-2 animate-slide-up" {...spekit(SPEKIT.quizResultsReview)}>
          {/* Main Grade Header Cards */}
          <WhatsAppShare
            score={results.score}
            quizId={quiz.id}
            quizTitle={quiz.title}
            correctCount={results.correctCount}
            totalQuestions={results.totalQuestions}
          />

          {/* Action guidance after submit */}
          {wrongAnswersCount > 0 ? (
            <Card className="border-amber-200 bg-amber-50/30 dark:border-amber-900/40 dark:bg-amber-950/10">
              <CardContent className="flex items-start gap-3 p-4">
                <HelpCircle className="size-6 text-amber-600 dark:text-amber-500 shrink-0 mt-0.5" />
                <div className="text-start">
                  <h3 className="font-bold text-sm text-amber-900 dark:text-amber-300">
                    راجع تفاصيل الأخطاء بالخلف
                  </h3>
                  <p className="mt-1 text-xs leading-relaxed text-amber-800/90 dark:text-amber-400/90">
                    لقد قمنا بفتح شروحات جميع الأسئلة أعلاه. ابحث عن الأسئلة المحددة باللون الأحمر، وستجد شرح خطوات تفكيرها مفتوحاً تلقائياً لتتعلم الحل الصحيح بيدك.
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card className="border-green-200 bg-green-50/40 dark:border-green-900/40 dark:bg-green-950/10">
              <CardContent className="flex items-center gap-3.5 p-4 text-start">
                <div className="flex size-9 items-center justify-center rounded-full bg-green-100 dark:bg-green-950/60">
                  <CheckCircle2 className="size-5 text-green-600 dark:text-green-500" />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm text-green-900 dark:text-green-300">
                    علامة كاملة، فخورين فيك!
                  </h3>
                  <p className="mt-0.5 text-xs text-green-800/80 dark:text-green-400/80">
                    أحسنت جداً! لقد أجبت على جميع الأسئلة بشكل صحيح. استمر على هذا المستوى المتميز.
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Return Dashboard button */}
          <div className="pt-2">
            <Link href="/dashboard" className="block">
              <Button
                variant="outline"
                className="h-12 w-full font-bold border-brand-200 hover:bg-brand-50 dark:border-brand-900 dark:hover:bg-brand-950/20"
              >
                العودة للوحة التحكم للطلاب
              </Button>
            </Link>
          </div>
        </div>
      )}

      {/* Sticky Bottom Actions Bar (During Quiz) */}
      {!isSubmitted && questions.length > 0 && (
        <div className="fixed bottom-0 inset-x-0 bg-white/80 dark:bg-background/80 backdrop-blur-md border-t border-brand-100/50 dark:border-brand-950/40 p-4 z-30 shadow-lg safe-bottom animate-slide-up">
          <div className="mx-auto max-w-md space-y-3">
            {error && (
              <div
                role="alert"
                className="flex items-start gap-2 rounded-xl bg-destructive/10 px-4 py-2.5 text-xs text-destructive text-start"
              >
                <AlertCircle className="size-4 shrink-0 text-destructive mt-0.5" />
                <span className="font-bold">{error}</span>
              </div>
            )}
            <Button
              size="lg"
              className={cn(
                "h-12 w-full text-base font-extrabold transition-all duration-300",
                "bg-brand-600 text-white shadow-md hover:bg-brand-700 active:scale-[0.98]",
                "disabled:opacity-50 disabled:active:scale-100"
              )}
              onClick={handleSubmit}
              disabled={isPending}
              {...spekit(SPEKIT.quizSubmitButton)}
            >
              {isPending ? "جاري تسليم الإجابات وحساب النتيجة..." : "تسليم الإجابات وإنهاء الاختبار 🏁"}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
