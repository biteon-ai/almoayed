"use client";

import { ArrowRight, LayoutGrid } from "lucide-react";
import { QuizTimerBadge } from "@/components/quiz/QuizTimerBadge";
import { SPEKIT, spekit } from "@/lib/spekit-targets";
import { cn } from "@/lib/utils";

export function QuizPlayerHeader({
  showTimer,
  remainingSeconds,
  durationMinutes,
  onExit,
  onOpenJump,
}: {
  showTimer: boolean;
  remainingSeconds: number;
  durationMinutes?: number;
  onExit: () => void;
  onOpenJump?: () => void;
}) {
  return (
    <header
      className={cn(
        "sticky top-16 z-30 -mx-4 mb-4 grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-2",
        "border-b border-border bg-background/90 px-3 py-2 backdrop-blur-md md:top-[4.5rem]"
      )}
      {...spekit(SPEKIT.quizPlayerHeader)}
    >
      <div className="flex items-center justify-start">
        <button
          type="button"
          onClick={onExit}
          className={cn(
            "inline-flex min-h-11 min-w-11 items-center justify-center rounded-xl",
            "text-foreground transition-colors hover:bg-muted"
          )}
          aria-label="خروج"
          {...spekit(SPEKIT.quizExitButton)}
        >
          <ArrowRight className="size-5" aria-hidden />
        </button>
      </div>
      <div className="flex min-w-0 items-center justify-center">
        {showTimer ? (
          <QuizTimerBadge
            remainingSeconds={remainingSeconds}
            durationMinutes={durationMinutes}
            compact
          />
        ) : (
          <p className="truncate text-center text-sm font-bold text-muted-foreground">
            الاختبار
          </p>
        )}
      </div>
      <div className="flex items-center justify-end">
        {onOpenJump ? (
          <button
            type="button"
            className={cn(
              "inline-flex min-h-11 shrink-0 items-center gap-1.5 rounded-xl",
              "border border-border/80 bg-muted/40 px-3 text-xs font-bold text-foreground",
              "transition-colors hover:bg-muted"
            )}
            onClick={onOpenJump}
            data-spekit={SPEKIT.quizAllQuestions}
          >
            <LayoutGrid className="size-4 shrink-0" aria-hidden />
            كل الأسئلة
          </button>
        ) : (
          <span className="inline-block min-h-11 min-w-11" aria-hidden />
        )}
      </div>
    </header>
  );
}
