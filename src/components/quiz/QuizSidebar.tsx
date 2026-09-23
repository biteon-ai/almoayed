"use client";

import type { Quiz, QuizSubmitResult } from "@/types/database";
import { QuestionNavGrid } from "@/components/quiz/QuestionNavGrid";
import { Progress } from "@/components/ui/progress";
import { Lock, Unlock } from "lucide-react";
import { cn } from "@/lib/utils";
import { SPEKIT, spekit } from "@/lib/spekit-targets";

interface QuizSidebarProps {
  quiz: Quiz;
  questionCount: number;
  questionIds: string[];
  answeredCount: number;
  progress: number;
  isSubmitted: boolean;
  activeIndex: number;
  answers: Record<string, string>;
  results: QuizSubmitResult | null;
  onNavigate: (index: number) => void;
  className?: string;
}

function ProgressRing({ value }: { value: number }) {
  const radius = 36;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (value / 100) * circumference;

  return (
    <div className="relative flex size-24 items-center justify-center">
      <svg className="size-full -rotate-90" viewBox="0 0 88 88" aria-hidden>
        <circle
          cx="44"
          cy="44"
          r={radius}
          className="stroke-slate-100 dark:stroke-slate-700"
          strokeWidth="6"
          fill="transparent"
        />
        <circle
          cx="44"
          cy="44"
          r={radius}
          className="stroke-brand-500 transition-all duration-500"
          strokeWidth="6"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          fill="transparent"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-lg font-black tabular-nums text-slate-800 dark:text-white">
          {Math.round(value)}%
        </span>
        <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-300">تقدم</span>
      </div>
    </div>
  );
}

export function QuizSidebar({
  quiz,
  questionCount,
  questionIds,
  answeredCount,
  progress,
  isSubmitted,
  activeIndex,
  answers,
  results,
  onNavigate,
  className,
}: QuizSidebarProps) {
  return (
    <aside
      className={cn(
        "space-y-4 md:sticky md:top-24 md:self-start",
        className
      )}
    >
      {/* Quiz header card */}
      <div
        className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900 dark:shadow-none"
        {...spekit(SPEKIT.quizGatekeeper)}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 space-y-2">
            <h1 className="text-start text-lg font-extrabold leading-tight text-slate-900 dark:text-white md:text-xl">
              {quiz.title}
            </h1>
            <div className="flex items-center gap-1.5 text-xs font-semibold">
              {isSubmitted ? (
                <>
                  <Unlock className="size-3.5 shrink-0 text-green-600 dark:text-emerald-400" />
                  <span className="text-green-700 dark:text-emerald-300">
                    تم فتح الحلول والشرح العلمي
                  </span>
                </>
              ) : (
                <>
                  <Lock className="size-3.5 shrink-0 text-amber-600 dark:text-amber-400" />
                  <span className="text-amber-700 dark:text-amber-300">
                    الحلول مقفلة حتى ترسل إجاباتك
                  </span>
                </>
              )}
            </div>
          </div>
          <span className="shrink-0 rounded-full border border-brand-100 bg-brand-50 px-3 py-1 text-xs font-bold text-brand-800 dark:border-brand-800/50 dark:bg-brand-950/40 dark:text-brand-200">
            {questionCount} {questionCount === 1 ? "سؤال" : "أسئلة"}
          </span>
        </div>
      </div>

      {/* Question navigation */}
      {questionCount > 0 && (
        <div className="rounded-2xl border border-border/60 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900 dark:shadow-none">
          <h2 className="mb-3 text-xs font-bold text-muted-foreground dark:text-slate-300">
            التنقل بين الأسئلة
          </h2>
          <QuestionNavGrid
            count={questionCount}
            activeIndex={activeIndex}
            isSubmitted={isSubmitted}
            answers={answers}
            questionIds={questionIds}
            results={results}
            onNavigate={onNavigate}
          />
          {isSubmitted ? (
            <div className="mt-3 flex flex-wrap gap-2 text-[10px] font-semibold text-muted-foreground">
              <span className="inline-flex items-center gap-1.5">
                <span className="size-2.5 rounded-sm bg-emerald-600" />
                الحالي
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="size-2.5 rounded-sm bg-emerald-100 ring-1 ring-emerald-200" />
                صحيح
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="size-2.5 rounded-sm bg-rose-100 ring-1 ring-rose-200" />
                خطأ
              </span>
            </div>
          ) : null}
        </div>
      )}

      {/* Progress card */}
      {!isSubmitted && questionCount > 0 && (
        <div
          className="rounded-2xl border border-slate-100 bg-gradient-to-br from-brand-50/50 to-white p-5 shadow-sm dark:border-slate-700 dark:from-brand-950/30 dark:to-slate-900 dark:shadow-none"
          {...spekit(SPEKIT.quizProgress)}
        >
          <div className="flex items-center gap-4">
            <ProgressRing value={progress} />
            <div className="min-w-0 flex-1 space-y-2">
              <p className="text-sm font-bold text-slate-800 dark:text-white">تقدمك بالاختبار</p>
              <p className="text-xs text-slate-500">
                {answeredCount} من {questionCount} أسئلة محلولة
              </p>
              <Progress value={progress} className="h-1.5 bg-slate-100" />
            </div>
          </div>
        </div>
      )}

      {isSubmitted && results && (
        <div className="rounded-2xl border border-emerald-200/80 bg-gradient-to-br from-emerald-50 to-teal-50/80 p-5 text-center shadow-sm dark:border-emerald-800/50 dark:from-emerald-950/40 dark:to-teal-950/30">
          <p className="text-xs font-semibold text-emerald-800 dark:text-emerald-200">
            نتيجتك النهائية
          </p>
          <p className="mt-1 text-3xl font-black tabular-nums text-emerald-700 dark:text-emerald-300">
            {results.score}%
          </p>
          <p className="mt-1 text-xs text-emerald-700/80 dark:text-emerald-300/80">
            {results.correctCount} / {results.totalQuestions} إجابات صحيحة
          </p>
        </div>
      )}
    </aside>
  );
}
