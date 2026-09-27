"use client";

import { RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";

interface PageLoadingViewProps {
  message?: string;
  subMessage?: string;
  /**
   * Fill the shell **content** area (default). Pass `false` only for rare
   * full-viewport surfaces outside authenticated chrome.
   */
  compact?: boolean;
  className?: string;
}

/**
 * Unified in-shell loading — spinner + message dead-centered in the content area.
 * Authenticated layouts keep header / bottom nav mounted around this view.
 */
export function PageLoadingView({
  message = "جاري التحميل…",
  subMessage = "نحضّر صفحتك",
  compact = true,
  className,
}: PageLoadingViewProps) {
  return (
    <div
      className={cn(
        "flex w-full flex-col items-center justify-center px-6 text-foreground",
        // Dead-center in remaining viewport under sticky header (+ bottom tabs on mobile).
        // Avoid large py-* which bias the block toward the top of the screen.
        compact
          ? "min-h-[max(60vh,calc(100dvh-10rem))] md:min-h-[max(60vh,calc(100dvh-5.5rem))]"
          : "min-h-dvh bg-background dark:bg-slate-950",
        className
      )}
      role="status"
      aria-live="polite"
      aria-busy="true"
      data-page-loading="true"
    >
      <div className="flex max-w-xs flex-col items-center text-center animate-fade-in">
        <div
          className={cn(
            "relative mb-5 flex size-16 items-center justify-center rounded-2xl border shadow-md",
            "border-brand-200/50 bg-background",
            "dark:border-slate-700 dark:bg-slate-900 dark:shadow-none"
          )}
        >
          <RefreshCw
            className="size-8 animate-spin text-brand-600 dark:text-brand-400"
            strokeWidth={2.25}
            aria-hidden
          />
        </div>
        <p className="text-sm font-extrabold text-foreground dark:text-white">
          {message}
        </p>
        <p className="mt-1.5 text-xs text-muted-foreground dark:text-slate-300">
          {subMessage}
        </p>
        <div className="mt-4 flex gap-1.5" aria-hidden>
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              className={cn(
                "size-1.5 rounded-full bg-brand-500/60 animate-pulse",
                i === 1 && "[animation-delay:150ms]",
                i === 2 && "[animation-delay:300ms]"
              )}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
