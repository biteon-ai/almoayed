"use client";

import { RefreshCw } from "lucide-react";
import { APP_NAME } from "@/lib/constants";
import { SPEKIT } from "@/lib/spekit-targets";
import { cn } from "@/lib/utils";

interface LoginLoadingOverlayProps {
  show: boolean;
  message: string;
  subMessage?: string;
}

export function LoginLoadingOverlay({
  show,
  message,
  subMessage = "لحظة من فضلك…",
}: LoginLoadingOverlayProps) {
  if (!show) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-background/85 backdrop-blur-md"
      role="status"
      aria-live="polite"
      aria-busy="true"
      data-spekit={SPEKIT.loginLoading}
    >
      <div className="mx-6 flex max-w-xs flex-col items-center text-center animate-fade-in">
        <div className="relative mb-6 flex size-20 items-center justify-center rounded-2xl border border-brand-200/60 bg-gradient-to-b from-brand-50 to-background shadow-lg dark:border-brand-800/40 dark:from-brand-950/40">
          <RefreshCw
            className="size-10 animate-spin text-brand-600 dark:text-brand-400"
            strokeWidth={2.25}
            aria-hidden
          />
          <span className="absolute -bottom-1 size-3 animate-pulse rounded-full bg-brand-500 ring-4 ring-background" />
        </div>

        <p className="text-base font-extrabold text-foreground">{message}</p>
        <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
          {subMessage}
        </p>

        <div className="mt-5 flex items-center gap-1.5" aria-hidden>
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              className={cn(
                "size-1.5 rounded-full bg-brand-500/70 animate-pulse",
                i === 1 && "[animation-delay:150ms]",
                i === 2 && "[animation-delay:300ms]"
              )}
            />
          ))}
        </div>

        <p className="mt-6 text-[10px] font-bold tracking-wide text-muted-foreground/70">
          {APP_NAME}
        </p>
      </div>
    </div>
  );
}
