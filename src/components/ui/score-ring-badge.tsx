import { getScoreGrade, scoreRingDashOffset } from "@/lib/student-quiz-ui";
import { SPEKIT, spekit } from "@/lib/spekit-targets";
import { cn } from "@/lib/utils";

const RING_RADIUS = 15.5;
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;

const toneStyles = {
  green: {
    well: "bg-emerald-50 dark:bg-emerald-950/50",
    track: "stroke-emerald-200/80 dark:stroke-emerald-800/70",
    bar: "stroke-emerald-500 dark:stroke-emerald-400",
    text: "text-emerald-700 dark:text-emerald-200",
  },
  amber: {
    well: "bg-amber-50 dark:bg-amber-950/50",
    track: "stroke-amber-200/80 dark:stroke-amber-800/70",
    bar: "stroke-amber-500 dark:stroke-amber-400",
    text: "text-amber-800 dark:text-amber-200",
  },
  red: {
    well: "bg-rose-50 dark:bg-rose-950/50",
    track: "stroke-rose-200/80 dark:stroke-rose-800/70",
    bar: "stroke-rose-500 dark:stroke-rose-400",
    text: "text-rose-700 dark:text-rose-200",
  },
} as const;

export function ScoreRingBadge({
  score,
  size = "md",
  className,
}: {
  score: number;
  size?: "sm" | "md";
  className?: string;
}) {
  const clamped = Math.min(100, Math.max(0, Math.round(score)));
  const tone = getScoreGrade(clamped).tone;
  const styles = toneStyles[tone];
  const offset = scoreRingDashOffset(clamped, RING_CIRCUMFERENCE);

  return (
    <span
      dir="ltr"
      role="img"
      aria-label={`النتيجة ${clamped}%`}
      className={cn(
        "relative inline-flex shrink-0 items-center justify-center",
        size === "sm" ? "size-12" : "size-14",
        className
      )}
      {...spekit(SPEKIT.resultsScoreBadge)}
    >
      <span
        className={cn(
          "absolute inset-[6px] rounded-full shadow-inner",
          styles.well
        )}
        aria-hidden
      />
      <svg
        viewBox="0 0 36 36"
        className="absolute inset-0 size-full -rotate-90"
        aria-hidden
      >
        <circle
          cx="18"
          cy="18"
          r={RING_RADIUS}
          fill="none"
          strokeWidth="2.6"
          className={styles.track}
        />
        <circle
          cx="18"
          cy="18"
          r={RING_RADIUS}
          fill="none"
          strokeWidth="2.6"
          strokeLinecap="round"
          strokeDasharray={RING_CIRCUMFERENCE}
          strokeDashoffset={offset}
          className={cn(styles.bar, "transition-[stroke-dashoffset] duration-500")}
        />
      </svg>
      <span
        className={cn(
          "pointer-events-none absolute inset-0 z-10 flex items-center justify-center gap-px",
          "whitespace-nowrap leading-none",
          styles.text
        )}
      >
        <span className="text-sm font-bold tabular-nums tracking-tight">
          {clamped}
        </span>
        <span className="text-[10px] font-bold leading-none">%</span>
      </span>
    </span>
  );
}
