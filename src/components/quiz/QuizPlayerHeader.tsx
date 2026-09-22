"use client";

import { ArrowRight, LayoutGrid } from "lucide-react";
import { QuizTimerBadge } from "@/components/quiz/QuizTimerBadge";
import { SPEKIT, spekit } from "@/lib/spekit-targets";
import { cn } from "@/lib/utils";

export function QuizPlayerHeader({
  title,
  showTimer,
  remainingSeconds,
  durationMinutes,
  onExit,
  onOpenJump,
}: {
  title: string;
  showTimer: boolean;
  remainingSeconds: number;
  durationMinutes?: number;
  onExit: () => void;
  onOpenJump?: () => void;
}) {
  const displayTitle = title.trim() || "الاختبار";

  return (
    <header
      className={cn(
        "sticky top-0 z-40 -mx-4 mb-2 flex flex-col gap-1.5",
        "border-b border-border bg-background/95 px-3 py-1.5 backdrop-blur-md",
        "md:mb-3 md:gap-2 md:py-2"
      )}
      {...spekit(SPEKIT.quizPlayerHeader)}
    >
      <div className="flex min-w-0 items-center justify-between gap-1.5">
        <button
          type="button"
          onClick={onExit}
          className={cn(
            "inline-flex h-9 shrink-0 items-center justify-center gap-1 rounded-full px-2.5 sm:h-10 sm:gap-1.5 sm:px-3",
            "border border-border/70 bg-muted/40 text-foreground shadow-sm",
            "transition-colors hover:bg-muted active:scale-[0.98]",
            "dark:border-slate-600 dark:bg-slate-800/80 dark:text-white",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/30"
          )}
          aria-label="رجوع"
          {...spekit(SPEKIT.quizExitButton)}
        >
          <ArrowRight className="size-4 shrink-0" aria-hidden />
          <span className="text-xs font-bold leading-none">رجوع</span>
        </button>

        <h1
          className={cn(
            "min-w-0 flex-1 truncate text-center text-sm font-bold text-foreground dark:text-slate-100",
            "max-w-[12.5rem] sm:max-w-[18rem] md:max-w-md"
          )}
          title={displayTitle}
        >
          {displayTitle}
        </h1>

        {onOpenJump ? (
          <button
            type="button"
            className={cn(
              "inline-flex size-9 shrink-0 items-center justify-center gap-1.5 rounded-full sm:h-10 sm:w-auto sm:rounded-xl sm:px-3",
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
          <span className="inline-block size-9 shrink-0" aria-hidden />
        )}
      </div>

      {showTimer ? (
        <div className="min-w-0 w-full">
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
