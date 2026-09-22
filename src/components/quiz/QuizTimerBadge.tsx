"use client";

import { SPEKIT, spekit } from "@/lib/spekit-targets";
import {
  formatRemainingMmSs,
  isWarningRemaining,
  remainingTimeFraction,
  timerProgressTone,
  type TimerProgressTone,
} from "@/lib/quiz-timer";
import { cn } from "@/lib/utils";
import { Timer } from "lucide-react";

interface QuizTimerBadgeProps {
  remainingSeconds: number;
  durationMinutes?: number;
  compact?: boolean;
}

const toneChrome: Record<
  TimerProgressTone,
  { shell: string; icon: string; label: string }
> = {
  green: {
    shell:
      "border border-border/60 bg-muted/30 text-foreground dark:border-slate-700 dark:bg-slate-900/70 dark:text-white",
    icon: "text-emerald-600 dark:text-emerald-300",
    label: "text-muted-foreground dark:text-slate-300",
  },
  amber: {
    shell:
      "border border-amber-200/80 bg-amber-50/95 text-amber-800 dark:border-amber-800/60 dark:bg-amber-950/90 dark:text-amber-100",
    icon: "text-amber-600 dark:text-amber-300",
    label: "text-amber-700/80 dark:text-amber-200/80",
  },
  red: {
    shell:
      "border border-rose-200/80 bg-rose-50/95 text-rose-700 dark:border-rose-800/60 dark:bg-rose-950/90 dark:text-rose-100",
    icon: "text-rose-600 dark:text-rose-300",
    label: "text-rose-700/80 dark:text-rose-200/80",
  },
};

const toneBar: Record<TimerProgressTone, { track: string; fill: string }> = {
  green: {
    track: "bg-emerald-200/70 dark:bg-slate-700",
    fill: "bg-emerald-500 dark:bg-emerald-400",
  },
  amber: {
    track: "bg-amber-200/80 dark:bg-amber-900/50",
    fill: "bg-amber-500 dark:bg-amber-400",
  },
  red: {
    track: "bg-rose-200/90 dark:bg-rose-900/60",
    fill: "bg-red-500 dark:bg-rose-400",
  },
};

export function QuizTimerBadge({
  remainingSeconds,
  durationMinutes,
  compact = false,
}: QuizTimerBadgeProps) {
  const expired = remainingSeconds <= 0;
  const showBar =
    compact && typeof durationMinutes === "number" && durationMinutes > 0;
  const fraction = showBar
    ? remainingTimeFraction(remainingSeconds, durationMinutes)
    : 0;
  const percent = Math.round(fraction * 100);

  const tone: TimerProgressTone = showBar
    ? timerProgressTone(remainingSeconds, durationMinutes!)
    : isWarningRemaining(remainingSeconds) || expired
      ? "red"
      : "green";

  const critical = tone === "red" && !expired;
  const chrome = toneChrome[tone];
  const bar = toneBar[tone];

  return (
    <div
      className={cn(
        compact
          ? "w-full rounded-xl px-2 py-1.5"
          : "sticky top-0 z-40 -mx-4 mb-4 border-b px-4 py-2.5 backdrop-blur-md sm:-mx-0 sm:rounded-2xl sm:border",
        compact
          ? chrome.shell
          : tone === "red"
            ? "border-rose-200/80 bg-rose-50/95 text-rose-700 dark:border-rose-800/60 dark:bg-rose-950/70 dark:text-rose-100"
            : tone === "amber"
              ? "border-amber-200/80 bg-amber-50/95 text-amber-800 dark:border-amber-900/40 dark:bg-amber-950/70 dark:text-amber-100"
              : "border-emerald-200/70 bg-emerald-50/95 text-emerald-800 dark:border-emerald-900/40 dark:bg-emerald-950/70 dark:text-emerald-100",
        !compact && tone === "red" && "border"
      )}
      dir="rtl"
      {...spekit(SPEKIT.quizTimer)}
      role="timer"
      aria-live="polite"
      aria-atomic="true"
    >
      <div
        className={cn(
          "flex items-center gap-2",
          compact
            ? "w-full justify-center"
            : "mx-auto max-w-7xl justify-center"
        )}
        dir={compact ? "ltr" : "rtl"}
      >
        <Timer
          className={cn(
            "size-4 shrink-0",
            critical && "animate-pulse",
            compact && chrome.icon
          )}
          aria-hidden
        />
        <span
          className={cn(
            "font-mono text-base font-black tabular-nums tracking-wide sm:text-lg",
            compact && tone === "green" && "dark:text-white",
            critical && "animate-pulse"
          )}
          dir="ltr"
        >
          {formatRemainingMmSs(remainingSeconds)}
        </span>
        <span
          className={cn(
            "text-xs font-bold leading-none",
            compact && chrome.label
          )}
          dir="rtl"
        >
          الوقت المتبقي
        </span>
      </div>
      {showBar ? (
        <div
          className={cn("w-full", compact ? "mt-1.5" : "mt-2")}
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={percent}
          aria-label="الوقت المتبقي"
          data-spekit={SPEKIT.quizTimerBar}
          data-tone={tone}
        >
          <div
            className={cn(
              "h-1.5 w-full overflow-hidden rounded-full transition-colors duration-500",
              bar.track
            )}
          >
            <div
              className={cn(
                "h-full rounded-full transition-[width,background-color] duration-1000 ease-linear",
                bar.fill
              )}
              style={{ width: `${fraction * 100}%` }}
            />
          </div>
        </div>
      ) : null}
    </div>
  );
}
