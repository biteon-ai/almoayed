"use client";

import { Sparkles } from "lucide-react";
import { APP_NAME, APP_PLATFORM_BADGE, APP_SLOGAN } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { SPEKIT, spekit } from "@/lib/spekit-targets";

interface BrandHeaderProps {
  showSlogan?: boolean;
  /** Compact footprint for login / narrow viewports */
  compact?: boolean;
  className?: string;
}

export function BrandHeader({
  showSlogan = true,
  compact = false,
  className,
}: BrandHeaderProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center text-center",
        compact ? "space-y-1.5" : "space-y-4",
        className
      )}
      {...spekit(SPEKIT.loginBrandHeader)}
    >
      <div
        className={cn(
          "flex flex-row flex-wrap items-center justify-center",
          compact ? "gap-1.5 sm:gap-2" : "gap-3"
        )}
      >
        <span
          className={cn(
            "font-bold tracking-tight text-foreground",
            compact
              ? "text-xl leading-none xs:text-2xl sm:text-3xl"
              : "text-3xl md:text-4xl"
          )}
        >
          {APP_NAME}
        </span>
        <span
          className={cn(
            "inline-flex items-center rounded-full border border-brand-200/70 bg-white/90 font-bold text-brand-800 shadow-sm backdrop-blur-sm dark:border-brand-900/40 dark:bg-card/60 dark:text-brand-300",
            compact
              ? "gap-1 px-2 py-0.5 text-[10px] sm:px-2.5 sm:text-[11px]"
              : "gap-1.5 px-3 py-1 text-[11px]"
          )}
        >
          <Sparkles
            className={cn(
              "shrink-0 text-amber-500",
              compact ? "size-3" : "size-3.5"
            )}
          />
          {APP_PLATFORM_BADGE}
        </span>
      </div>
      {showSlogan && (
        <p
          className={cn(
            "max-w-xs font-medium tracking-wide text-muted-foreground",
            compact ? "text-[11px] sm:text-sm" : "mt-1 text-sm md:text-base"
          )}
        >
          {APP_SLOGAN}
        </p>
      )}
    </div>
  );
}
