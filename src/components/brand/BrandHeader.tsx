import { Sparkles } from "lucide-react";
import { APP_NAME, APP_SLOGAN } from "@/lib/constants";
import { cn } from "@/lib/utils";

interface BrandHeaderProps {
  showSlogan?: boolean;
  className?: string;
}

export function BrandHeader({ showSlogan = true, className }: BrandHeaderProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center space-y-4 text-center",
        className
      )}
    >
      <div className="flex flex-row flex-wrap items-center justify-center gap-3">
        <span className="text-3xl font-bold tracking-tight text-foreground md:text-4xl">
          {APP_NAME}
        </span>
        <span className="inline-flex items-center gap-1.5 rounded-full border border-brand-200/70 bg-white/90 px-3 py-1 text-[11px] font-bold text-brand-800 shadow-sm backdrop-blur-sm dark:border-brand-900/40 dark:bg-card/60 dark:text-brand-300">
          <Sparkles className="size-3.5 shrink-0 text-amber-500" />
          بكالوريا رياضيات سورية
        </span>
      </div>
      {showSlogan && (
        <p className="mt-1 max-w-xs text-sm font-medium tracking-wide text-muted-foreground md:text-base">
          {APP_SLOGAN}
        </p>
      )}
    </div>
  );
}
