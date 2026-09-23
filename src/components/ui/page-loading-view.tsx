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
}

/**
 * Unified in-shell loading — spinner card + pulsed dots inside the main column.
 * Authenticated layouts keep header / bottom nav mounted around this view.
 */
export function PageLoadingView({
  message = "جاري التحميل…",
  subMessage = "نحضّر صفحتك",
  compact = true,
}: PageLoadingViewProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center px-6 text-foreground",
        compact
          ? "min-h-[50vh] bg-transparent py-16"
          : "min-h-dvh bg-background py-16 dark:bg-slate-950"
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
