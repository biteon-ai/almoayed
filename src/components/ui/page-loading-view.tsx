"use client";

import { RefreshCw } from "lucide-react";
import { APP_NAME } from "@/lib/constants";
import { cn } from "@/lib/utils";

interface PageLoadingViewProps {
  message?: string;
  subMessage?: string;
}

export function PageLoadingView({
  message = "جاري التحميل…",
  subMessage = "نحضّر صفحتك",
}: PageLoadingViewProps) {
  return (
    <div
      className="flex min-h-dvh flex-col items-center justify-center bg-gradient-to-b from-brand-50/30 to-background px-6 dark:from-brand-950/20"
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <div className="flex max-w-xs flex-col items-center text-center animate-fade-in">
        <div className="relative mb-5 flex size-16 items-center justify-center rounded-2xl border border-brand-200/50 bg-background shadow-md dark:border-brand-800/30">
          <RefreshCw
            className="size-8 animate-spin text-brand-600 dark:text-brand-400"
            strokeWidth={2.25}
            aria-hidden
          />
        </div>
        <p className="text-sm font-extrabold text-foreground">{message}</p>
        <p className="mt-1.5 text-xs text-muted-foreground">{subMessage}</p>
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
        <p className="mt-5 text-[10px] font-bold text-muted-foreground/60">
          {APP_NAME}
        </p>
      </div>
    </div>
  );
}
