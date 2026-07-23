"use client";

import { cn } from "@/lib/utils";
import type { QuizSubmitResult } from "@/types/database";

export type QuestionNavStatus =
  | "default"
  | "answered"
  | "active"
  | "correct"
  | "wrong"
  | "unanswered-review";

interface QuestionNavGridProps {
  count: number;
  activeIndex: number;
  isSubmitted: boolean;
  answers: Record<string, string>;
  questionIds: string[];
  results: QuizSubmitResult | null;
  onNavigate: (index: number) => void;
}

function getQuestionStatus(
  index: number,
  activeIndex: number,
  questionId: string,
  isSubmitted: boolean,
  answers: Record<string, string>,
  results: QuizSubmitResult | null
): QuestionNavStatus {
  if (index === activeIndex) return "active";

  if (isSubmitted && results) {
    const answer = results.answers.find((a) => a.questionId === questionId);
    if (!answer) return "unanswered-review";
    return answer.isCorrect ? "correct" : "wrong";
  }

  if (answers[questionId]) return "answered";
  return "default";
}

const statusStyles: Record<QuestionNavStatus, string> = {
  default:
    "border-border/70 bg-white text-slate-600 hover:border-emerald-200 hover:bg-emerald-50/50 dark:bg-card",
  answered:
    "border-emerald-200 bg-emerald-50 text-emerald-800 hover:border-emerald-300 dark:border-emerald-800/50 dark:bg-emerald-950/30 dark:text-emerald-200",
  active:
    "border-emerald-600 bg-emerald-600 font-extrabold text-white shadow-md shadow-emerald-600/30 ring-2 ring-emerald-300/50 ring-offset-1 ring-offset-background",
  correct:
    "border-emerald-200/90 bg-emerald-100/90 text-emerald-800 dark:border-emerald-800/50 dark:bg-emerald-950/45 dark:text-emerald-200",
  wrong:
    "border-rose-200/90 bg-rose-100/90 text-rose-800 dark:border-rose-800/50 dark:bg-rose-950/45 dark:text-rose-200",
  "unanswered-review":
    "border-border/60 bg-muted/50 text-muted-foreground",
};

export function QuestionNavGrid({
  count,
  activeIndex,
  isSubmitted,
  answers,
  questionIds,
  results,
  onNavigate,
}: QuestionNavGridProps) {
  if (count === 0) return null;

  return (
    <div className="grid grid-cols-5 gap-2.5 sm:grid-cols-6 md:grid-cols-4 lg:grid-cols-5">
      {Array.from({ length: count }, (_, index) => {
        const status = getQuestionStatus(
          index,
          activeIndex,
          questionIds[index] ?? "",
          isSubmitted,
          answers,
          results
        );

        return (
          <button
            key={questionIds[index] ?? index}
            type="button"
            onClick={() => onNavigate(index)}
            aria-label={`السؤال ${index + 1}`}
            aria-current={index === activeIndex ? "step" : undefined}
            className={cn(
              "flex size-10 items-center justify-center rounded-xl border text-sm font-bold tabular-nums transition-all duration-200",
              "touch-manipulation active:scale-95",
              statusStyles[status]
            )}
          >
            {index + 1}
          </button>
        );
      })}
    </div>
  );
}
