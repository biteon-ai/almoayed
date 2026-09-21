"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { SPEKIT, spekit } from "@/lib/spekit-targets";
import {
  rtlCompactPagerSlots,
  questionNavStatus,
  type QuestionNavStatus,
} from "@/lib/quiz-player";
import type { QuizSubmitResult } from "@/types/database";

const statusStyles: Record<QuestionNavStatus, string> = {
  default:
    "border-border/70 bg-background text-muted-foreground hover:border-emerald-200 hover:bg-emerald-50/50",
  answered:
    "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-800/50 dark:bg-emerald-950/30 dark:text-emerald-200",
  active:
    "border-emerald-600 bg-emerald-600 font-extrabold text-white shadow-md shadow-emerald-600/30 ring-2 ring-emerald-300/50 ring-offset-1 ring-offset-background",
  correct:
    "border-emerald-200/90 bg-emerald-100/90 text-emerald-800 dark:border-emerald-800/50 dark:bg-emerald-950/45 dark:text-emerald-200",
  wrong:
    "border-rose-200/90 bg-rose-100/90 text-rose-800 dark:border-rose-800/50 dark:bg-rose-950/45 dark:text-rose-200",
  "unanswered-review":
    "border-border/60 bg-muted/50 text-muted-foreground",
};

export function QuestionPager({
  count,
  activeIndex,
  isSubmitted,
  answers,
  questionIds,
  results,
  onNavigate,
  className,
  compact = false,
}: {
  count: number;
  activeIndex: number;
  isSubmitted: boolean;
  answers: Record<string, string>;
  questionIds: string[];
  results: QuizSubmitResult | null;
  onNavigate: (index: number) => void;
  className?: string;
  compact?: boolean;
}) {
  if (count === 0) return null;

  const slots = rtlCompactPagerSlots(activeIndex, count);
  const box = compact ? "size-10" : "size-11";
  const icon = compact ? "size-4" : "size-5";

  function pill(index: number | null) {
    if (index === null) {
      return (
        <span className={cn(box, "shrink-0")} aria-hidden />
      );
    }

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
        type="button"
        onClick={() => onNavigate(index)}
        aria-label={`السؤال ${index + 1}`}
        aria-current={index === activeIndex ? "step" : undefined}
        className={cn(
          "flex shrink-0 items-center justify-center rounded-xl border text-sm font-bold tabular-nums",
          "touch-manipulation transition-colors duration-200",
          box,
          statusStyles[status]
        )}
      >
        {index + 1}
      </button>
    );
  }

  return (
    <div
      dir="ltr"
      className={cn(
        "flex shrink-0 items-center justify-center",
        compact ? "gap-1" : "gap-1.5",
        className
      )}
      {...spekit(SPEKIT.quizQuestionPager)}
    >
      <button
        type="button"
        className={cn(
          "inline-flex shrink-0 items-center justify-center rounded-xl border border-border bg-background text-foreground transition-colors hover:bg-muted disabled:pointer-events-none disabled:opacity-40",
          box
        )}
        disabled={!slots.canGoLeft}
        onClick={() => onNavigate(activeIndex + 1)}
        aria-label="السؤال التالي"
      >
        <ChevronLeft className={icon} aria-hidden />
      </button>
      {pill(slots.left)}
      {pill(slots.current)}
      {pill(slots.right)}
      <button
        type="button"
        className={cn(
          "inline-flex shrink-0 items-center justify-center rounded-xl border border-border bg-background text-foreground transition-colors hover:bg-muted disabled:pointer-events-none disabled:opacity-40",
          box
        )}
        disabled={!slots.canGoRight}
        onClick={() => onNavigate(activeIndex - 1)}
        aria-label="السؤال السابق"
      >
        <ChevronRight className={icon} aria-hidden />
      </button>
    </div>
  );
}
