"use client";

import { cn } from "@/lib/utils";
import type { QuizSubmitResult } from "@/types/database";
import {
  questionNavStatus,
  type QuestionNavStatus,
} from "@/lib/quiz-player";

interface QuestionNavGridProps {
  count: number;
  activeIndex: number;
  isSubmitted: boolean;
  answers: Record<string, string>;
  questionIds: string[];
  results: QuizSubmitResult | null;
  onNavigate: (index: number) => void;
  className?: string;
}

const statusStyles: Record<QuestionNavStatus, string> = {
  default:
    "border-border/70 bg-card text-muted-foreground hover:border-emerald-200 hover:bg-emerald-50/50",
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
  className,
}: QuestionNavGridProps) {
  if (count === 0) return null;

  return (
    <div className={cn("grid grid-cols-5 gap-2.5 sm:grid-cols-6", className)}>
      {Array.from({ length: count }, (_, index) => {
        const status = questionNavStatus({
          index,
          activeIndex,
          questionId: questionIds[index] ?? "",
          isSubmitted,
          answers,
          results,
        });

        return (
          <button
            key={questionIds[index] ?? index}
            type="button"
            onClick={() => onNavigate(index)}
            aria-label={`السؤال ${index + 1}`}
            aria-current={index === activeIndex ? "step" : undefined}
            className={cn(
              "digit-box min-h-11 min-w-11 rounded-xl border text-sm font-bold transition-all duration-200",
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
