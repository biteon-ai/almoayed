"use client";

import { ArrowRight, CalendarClock, LayoutGrid, Loader2 } from "lucide-react";
import { QuizTimerBadge } from "@/components/quiz/QuizTimerBadge";
import { LocalDateTime } from "@/components/ui/local-datetime";
import { SPEKIT, spekit } from "@/lib/spekit-targets";
import { cn } from "@/lib/utils";

export function QuizPlayerHeader({
  title,
  showTimer,
  remainingSeconds,
  durationMinutes,
  attemptSubmittedAt,
  onExit,
  onOpenJump,
  exitBusy = false,
}: {
  title: string;
  showTimer: boolean;
  remainingSeconds: number;
  durationMinutes?: number;
  /** When set (review / post-submit), show attempt date under the title. */
  attemptSubmittedAt?: string | null;
  onExit: () => void;
  onOpenJump?: () => void;
  /** Disable رجوع and show spinner while a route transition is in flight. */
  exitBusy?: boolean;
}) {
  const displayTitle = title.trim() || "الاختبار";
  const showAttemptMeta = Boolean(attemptSubmittedAt?.trim());

  return (
    <header
      className={cn(
        "sticky top-0 z-40 -mx-4 mb-2 flex flex-col gap-1.5",
        "border-b border-border bg-background/95 px-3 py-1.5 backdrop-blur-md",
        "md:mb-3 md:gap-2 md:py-2"
      )}
      {...spekit(SPEKIT.quizPlayerHeader)}
    >
      <div
        className={cn(
          "flex min-w-0 justify-between gap-1.5",
          showAttemptMeta ? "items-start" : "items-center"
        )}
      >
        <button
          type="button"
          onClick={onExit}
          disabled={exitBusy}
          aria-busy={exitBusy || undefined}
          className={cn(
            "inline-flex h-9 shrink-0 items-center justify-center gap-1 rounded-full px-2.5 sm:h-10 sm:gap-1.5 sm:px-3",
            "border border-border/70 bg-muted/40 text-foreground shadow-sm",
            "transition-colors hover:bg-muted active:scale-[0.98]",
            "dark:border-slate-600 dark:bg-slate-800/80 dark:text-white",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/30",
            "disabled:pointer-events-none disabled:opacity-60"
          )}
          aria-label={exitBusy ? "جاري الرجوع..." : "رجوع"}
          {...spekit(SPEKIT.quizExitButton)}
        >
          {exitBusy ? (
            <Loader2 className="size-4 shrink-0 animate-spin" aria-hidden />
          ) : (
            <ArrowRight className="size-4 shrink-0" aria-hidden />
          )}
          <span className="text-xs font-bold leading-none">
            {exitBusy ? "جاري..." : "رجوع"}
          </span>
        </button>

        <div className="flex min-w-0 flex-1 flex-col items-center px-1">
          <h1
            className={cn(
              "w-full truncate text-center text-sm font-bold leading-9 text-foreground dark:text-slate-100 sm:leading-10",
              "max-w-[12.5rem] sm:max-w-[18rem] md:max-w-md",
              showAttemptMeta && "mb-1"
            )}
            title={displayTitle}
          >
            {displayTitle}
          </h1>

          {showAttemptMeta && attemptSubmittedAt ? (
            <div
              className={cn(
                "inline-flex w-fit max-w-full items-start gap-1.5 rounded-2xl border border-amber-200 bg-amber-50 px-2.5 py-1",
                "text-center text-xs font-medium leading-snug text-amber-800",
                "dark:border-amber-800/60 dark:bg-amber-950/50 dark:text-amber-100"
              )}
              data-spekit={SPEKIT.quizAttemptMeta}
            >
              <CalendarClock
                className="mt-0.5 size-3.5 shrink-0 opacity-80"
                aria-hidden
              />
              <span className="min-w-0 text-balance break-words">
                <span>محاولة أرشيفية: </span>
                <LocalDateTime iso={attemptSubmittedAt} mode="datetime" />
              </span>
            </div>
          ) : null}
        </div>

        {onOpenJump ? (
          <button
            type="button"
            className={cn(
              "relative z-10 inline-flex size-11 shrink-0 touch-manipulation items-center justify-center gap-1.5 rounded-full sm:h-10 sm:w-auto sm:rounded-xl sm:px-3",
              "border border-border/80 bg-muted/40 text-foreground shadow-sm",
              "transition-colors hover:bg-muted active:scale-[0.98]",
              "dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/30"
            )}
            onClick={(event) => {
              event.stopPropagation();
              onOpenJump();
            }}
            aria-label="كل الأسئلة"
            aria-haspopup="dialog"
            data-spekit={SPEKIT.quizAllQuestions}
          >
            <LayoutGrid className="size-4 shrink-0" aria-hidden />
            <span className="hidden text-xs font-bold sm:inline">كل الأسئلة</span>
          </button>
        ) : (
          <span className="inline-block size-11 shrink-0" aria-hidden />
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
