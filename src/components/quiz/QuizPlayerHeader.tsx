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
        "sticky top-16 z-30 -mx-4 mb-4 flex flex-col gap-2",
        "border-b border-border bg-background/90 px-3 py-2 backdrop-blur-md md:top-[4.5rem]"
      )}
      {...spekit(SPEKIT.quizPlayerHeader)}
    >
      {/* Action row — back / title / jump sheet (never shares space with the timer bar) */}
      <div className="flex min-w-0 items-center justify-between gap-2">
        <button
          type="button"
          onClick={onExit}
          className={cn(
            "inline-flex h-10 shrink-0 items-center justify-center gap-1 rounded-full px-2.5 sm:gap-1.5 sm:px-3",
            "border border-border/70 bg-muted/40 text-foreground shadow-sm",
            "transition-colors hover:bg-muted active:scale-[0.98]",
            "dark:border-slate-600 dark:bg-slate-800/80 dark:text-white",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/30"
          )}
          aria-label="رجوع"
          {...spekit(SPEKIT.quizExitButton)}
        >
          <ArrowRight className="size-4 shrink-0 sm:size-5" aria-hidden />
          <span className="text-xs font-bold leading-none">رجوع</span>
        </button>

        {!showTimer ? (
          <p className="min-w-0 flex-1 truncate text-center text-sm font-bold text-muted-foreground dark:text-slate-300">
            الاختبار
          </p>
        ) : (
          <span className="min-w-0 flex-1" aria-hidden />
        )}

        {onOpenJump ? (
          <button
            type="button"
            className={cn(
              "inline-flex size-11 shrink-0 items-center justify-center gap-1.5 rounded-full sm:h-10 sm:w-auto sm:rounded-xl sm:px-3",
              "border border-border/80 bg-muted/40 text-foreground shadow-sm",
              "transition-colors hover:bg-muted active:scale-[0.98]",
              "dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100"
            )}
            onClick={onOpenJump}
            aria-label="كل الأسئلة"
            data-spekit={SPEKIT.quizAllQuestions}
          >
            <LayoutGrid className="size-4 shrink-0" aria-hidden />
            <span className="hidden text-xs font-bold sm:inline">كل الأسئلة</span>
          </button>
        ) : (
          <span className="inline-block size-11 shrink-0" aria-hidden />
        )}
      </div>

      {/* Dedicated full-width timer + progress row */}
      {showTimer ? (
        <div className="min-w-0 w-full px-0.5">
          <QuizTimerBadge
            remainingSeconds={remainingSeconds}
            durationMinutes={durationMinutes}
            compact
          />
        </div>
      ) : null}
    </header>
  );
}
