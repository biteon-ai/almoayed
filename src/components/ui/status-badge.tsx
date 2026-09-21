import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

/** Shared chip chrome — icon + label vertically/horizontally centered (RTL-safe). */
const baseClass =
  "inline-flex min-h-6 w-fit items-center justify-center gap-1 rounded-full border px-3 py-1 text-xs font-medium leading-none shadow-sm [&>svg]:!size-3.5 [&>svg]:shrink-0";

/**
 * Semantic badge tones for quiz/student status chips.
 * Palette roles:
 * - active  → success / visible (emerald)
 * - hidden  → muted / not visible (slate)
 * - free    → polished neutral tier (sky)
 * - pro     → premium tier (amber)
 * - regular → audience type “all students” (indigo)
 * - group   → audience type restricted (violet)
 */
export const statusBadgeStyles = {
  active:
    "border-emerald-300/90 bg-emerald-100 text-emerald-800 dark:border-emerald-700/60 dark:bg-emerald-950/50 dark:text-emerald-200",
  hidden:
    "border-slate-300 bg-slate-100 text-slate-600 dark:border-slate-600 dark:bg-slate-900/50 dark:text-slate-300",
  free:
    "border-sky-300/90 bg-sky-50 text-sky-800 dark:border-sky-700/60 dark:bg-sky-950/40 dark:text-sky-200",
  pro:
    "border-amber-300/90 bg-amber-100 text-amber-900 dark:border-amber-700/60 dark:bg-amber-950/40 dark:text-amber-200",
  regular:
    "border-indigo-200 bg-indigo-50 text-indigo-800 dark:border-indigo-800/50 dark:bg-indigo-950/40 dark:text-indigo-200",
  group:
    "border-violet-300/90 bg-violet-50 text-violet-800 dark:border-violet-800/50 dark:bg-violet-950/40 dark:text-violet-200",
  pending:
    "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-800/50 dark:bg-amber-950/40 dark:text-amber-200",
  deactivated:
    "border-slate-200 bg-slate-100 text-slate-500 dark:border-slate-700 dark:bg-slate-900/40 dark:text-slate-400",
  upgrade:
    "border-amber-300 bg-amber-100 text-amber-800 dark:border-amber-700/60 dark:bg-amber-950/40 dark:text-amber-200",
} as const;

export type StatusBadgeTone = keyof typeof statusBadgeStyles;

interface StatusBadgeProps {
  tone: StatusBadgeTone;
  children: React.ReactNode;
  className?: string;
}

export function StatusBadge({ tone, children, className }: StatusBadgeProps) {
  return (
    <Badge
      variant="outline"
      className={cn(baseClass, statusBadgeStyles[tone], className)}
    >
      {children}
    </Badge>
  );
}
