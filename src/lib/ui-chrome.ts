import { cn } from "@/lib/utils";

/** Soft icon well used on dashboard / KPI cards (RTL trailing side). */
export const statIconBadgeClass =
  "flex size-12 shrink-0 items-center justify-center rounded-xl bg-emerald-50 p-3 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-300";

/** Shared hover/active chip for educational-level and similar pill groups. */
export function choiceChipClass(selected: boolean, extra?: string) {
  return cn(
    "min-h-10 rounded-xl border px-3.5 text-xs font-semibold transition-all duration-200",
    selected
      ? "border-emerald-500 bg-emerald-50 text-emerald-800 shadow-sm ring-2 ring-emerald-100 dark:border-emerald-400 dark:bg-emerald-950/40 dark:text-emerald-100"
      : "border-gray-200 bg-background text-muted-foreground hover:border-emerald-300 hover:bg-emerald-50/60 hover:text-emerald-800 dark:border-border dark:hover:bg-emerald-950/20",
    extra
  );
}

/** Isolate `100%` so RTL does not render `%100`. */
export function formatPercent(value: number): string {
  return `${Math.round(value)}%`;
}

/** Arabic “current of total” as one phrase (`10 من 11`). */
export function formatCountOf(current: number, total: number): string {
  return `${current} من ${total}`;
}
