"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { submitQuiz } from "@/actions/quiz";
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
  HelpCircle,
} from "lucide-react";
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
  const [activeIndex, setActiveIndex] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const isSubmitted = results !== null;
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
      <div className="grid grid-cols-1 gap-6 md:grid-cols-12 md:gap-8">
        {/* Main workspace — RTL: right column */}
        <main
          className="order-2 space-y-6 md:order-1 md:col-span-8 lg:col-span-8"
          {...spekit(SPEKIT.quizQuestionList)}
        >
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
                    disabled={isSubmitted}
                    showResult={isSubmitted}
                    correctAnswer={activeResult?.correctAnswer}
                    categoryTag={activeResult?.categoryTag}
                    explanationText={activeResult?.explanationText}
                    explanationMediaUrl={activeResult?.explanationMediaUrl}
                  />
                )}
              </div>

              {/* Question pager */}
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
                  className="h-12 w-full rounded-xl font-bold border-slate-200 hover:bg-slate-50"
                >
                  العودة للوحة التحكم
                </Button>
              </Link>
            </div>
          )}
        </main>

        {/* Sidebar — RTL: left column; stacks above on mobile */}
        <QuizSidebar
          className="order-1 md:order-2 md:col-span-4 lg:col-span-4"
          quiz={quiz}
          questionCount={questions.length}
          questionIds={questionIds}
          answeredCount={answeredCount}
          progress={progress}
          isSubmitted={isSubmitted}
          activeIndex={activeIndex}
          answers={answers}
          results={results}
          onNavigate={goToQuestion}
        />
      </div>

      {/* Sticky submit bar */}
      {!isSubmitted && questions.length > 0 && (
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
                ? "جاري تسليم الإجابات وحساب النتيجة..."
                : "تسليم الإجابات وإنهاء الاختبار 🏁"}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
