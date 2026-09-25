import { cn } from "@/lib/utils";
import { formatCountOf, formatPercent } from "@/lib/ui-chrome";

/** Percent that stays `100%` (not `%100`) inside Arabic RTL. */
export function PercentText({
  value,
  className,
}: {
  value: number;
  className?: string;
}) {
  return (
    <span dir="ltr" className={cn("inline-block leading-none tabular-nums", className)}>
      {formatPercent(value)}
    </span>
  );
}

/** Count phrase with isolated numerals: `10 من 11`. */
export function CountOfText({
  current,
  total,
  className,
}: {
  current: number;
  total: number;
  className?: string;
}) {
  return (
    <span
      dir="rtl"
      className={cn("inline-flex items-baseline gap-1 tabular-nums", className)}
    >
      <bdi>{current}</bdi>
      <span>من</span>
      <bdi>{total}</bdi>
    </span>
  );
}

export { formatCountOf, formatPercent };
