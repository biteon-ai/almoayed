"use client";

import { SPEKIT, spekit } from "@/lib/spekit-targets";
import {
  formatRemainingMmSs,
  isWarningRemaining,
  remainingTimeFraction,
} from "@/lib/quiz-timer";
import { cn } from "@/lib/utils";
import { Timer } from "lucide-react";

interface QuizTimerBadgeProps {
  remainingSeconds: number;
  durationMinutes?: number;
  compact?: boolean;
}

export function QuizTimerBadge({
  remainingSeconds,
  durationMinutes,
  compact = false,
}: QuizTimerBadgeProps) {
  const warning = isWarningRemaining(remainingSeconds);
  const expired = remainingSeconds <= 0;
  const showBar =
    compact &&
    typeof durationMinutes === "number" &&
    durationMinutes > 0;
  const fraction = showBar
    ? remainingTimeFraction(remainingSeconds, durationMinutes)
    : 0;
  const percent = Math.round(fraction * 100);

  return (
    <div
      className={cn(
        compact
          ? "w-full rounded-xl px-2 py-1.5"
          : "sticky top-0 z-40 -mx-4 mb-4 border-b px-4 py-2.5 backdrop-blur-md sm:-mx-0 sm:rounded-2xl sm:border",
        expired || warning
          ? "border-rose-200/80 bg-rose-50/95 text-rose-700 dark:border-rose-900/50 dark:bg-rose-950/80 dark:text-rose-200"
          : compact
            ? "bg-transparent text-foreground"
            : "border-emerald-200/70 bg-emerald-50/95 text-emerald-800 dark:border-emerald-900/40 dark:bg-emerald-950/70 dark:text-emerald-100",
        compact && (expired || warning) && "border"
      )}
      dir="rtl"
      {...spekit(SPEKIT.quizTimer)}
      role="timer"
      aria-live="polite"
      aria-atomic="true"
    >
      <div
        className={cn(
          "flex items-center gap-1.5",
          compact
            ? "w-full justify-center"
            : "mx-auto max-w-7xl justify-center"
        )}
        dir={compact ? "ltr" : "rtl"}
      >
        <Timer
          className={cn(
            "size-4 shrink-0",
            warning && !expired && "animate-pulse"
          )}
          aria-hidden
        />
        <span
          className={cn(
            "font-mono text-base font-black tabular-nums tracking-wide",
            warning && !expired && "animate-pulse"
          )}
          dir="ltr"
        >
          {formatRemainingMmSs(remainingSeconds)}
        </span>
        <span className="text-xs font-bold leading-none" dir="rtl">
          الوقت المتبقي
        </span>
      </div>
      {showBar ? (
        <div
          className="mt-1.5 w-full"
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={percent}
          aria-label="الوقت المتبقي"
          data-spekit={SPEKIT.quizTimerBar}
        >
          <div
            className={cn(
              "h-1 w-full overflow-hidden rounded-full",
              expired || warning
                ? "bg-rose-200/80 dark:bg-rose-900/50"
                : "bg-muted"
            )}
          >
            <div
              className={cn(
                "h-full rounded-full transition-[width] duration-1000 ease-linear",
                expired || warning ? "bg-rose-600" : "bg-emerald-600"
              )}
              style={{ width: `${fraction * 100}%` }}
            />
          </div>
        </div>
      ) : null}
    </div>
  );
}
