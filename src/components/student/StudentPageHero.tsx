import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

const VARIANT_CLASS = {
  emerald:
    "bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-800",
  teal: "bg-gradient-to-l from-teal-700 via-emerald-600 to-teal-800",
} as const;

export type StudentPageHeroVariant = keyof typeof VARIANT_CLASS;

export interface StudentPageHeroProps {
  /** Optional DOM id (e.g. student-welcome for hash scroll). */
  id?: string;
  /** Spekit / data-spekit value when the hero itself is the target. */
  spekit?: string;
  variant?: StudentPageHeroVariant;
  /** Category pill — inline above/beside the title (in flow, no absolute float). */
  badge: ReactNode;
  /** Main page title. */
  title: ReactNode;
  /** Optional support line — hidden on phone, single line from sm+. */
  subtitle?: string;
  /** Extra content under the title (e.g. daily goal) — always visible, compact. */
  belowTitle?: ReactNode;
  /** Stats / streak slot under (mobile) or beside (sm+) the title block. */
  children?: ReactNode;
  className?: string;
}

/**
 * Shared green/teal page hero for student PWA hubs (UI-019).
 * Option 2 — inline badge + title stack with minimal gap (no floating absolute pill).
 */
export function StudentPageHero({
  id,
  spekit,
  variant = "emerald",
  badge,
  title,
  subtitle,
  belowTitle,
  children,
  className,
}: StudentPageHeroProps) {
  return (
    <section
      id={id}
      data-spekit={spekit}
      className={cn(
        "relative overflow-hidden rounded-2xl px-4 py-3 text-white shadow-lg sm:rounded-3xl sm:px-6 sm:py-5",
        VARIANT_CLASS[variant],
        className
      )}
    >
      <div className="pointer-events-none absolute -left-8 -top-8 h-28 w-28 rounded-full bg-white/10 blur-3xl" />

      <div className="relative z-10 flex min-w-0 flex-col gap-1.5 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
        <div className="min-w-0 w-full flex-1 space-y-0.5">
          {badge}
          <div className="min-w-0">{title}</div>
          {subtitle ? (
            <p className="hidden text-sm leading-snug text-emerald-100/90 sm:line-clamp-1 sm:block">
              {subtitle}
            </p>
          ) : null}
          {belowTitle}
        </div>

        {children ? (
          <div className="min-w-0 w-full shrink-0 sm:w-auto">{children}</div>
        ) : null}
      </div>
    </section>
  );
}

/**
 * Compact inline category pill for StudentPageHero.
 * Glass style fits inside the green card without adding height.
 */
export function StudentPageHeroBadge({
  children,
  className,
  variant: _variant = "emerald",
}: {
  children: ReactNode;
  className?: string;
  /** Kept for call-site compatibility; inline glass style is theme-agnostic. */
  variant?: StudentPageHeroVariant;
}) {
  void _variant;
  return (
    <span
      className={cn(
        "inline-flex max-w-full items-center gap-1 rounded-full border border-white/25 bg-white/15 px-2.5 py-0.5 text-xs font-medium leading-none text-white backdrop-blur-sm",
        className
      )}
    >
      {children}
    </span>
  );
}

/** Title styles shared by student hub heroes. */
export function studentPageHeroTitleClassName(extra?: string) {
  return cn(
    "break-words text-base font-bold leading-tight tracking-tight sm:text-xl sm:font-black sm:leading-snug",
    extra
  );
}
