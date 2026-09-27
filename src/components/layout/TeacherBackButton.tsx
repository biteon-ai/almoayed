"use client";

import { useRouter } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { startTopNavLoader } from "@/components/ui/top-loader";
import { SPEKIT, spekit } from "@/lib/spekit-targets";
import { cn } from "@/lib/utils";

type TeacherBackButtonProps = {
  fallbackHref: string;
  className?: string;
};

/**
 * Native-style mobile back control — same interaction as student header back.
 */
export function TeacherBackButton({
  fallbackHref,
  className,
}: TeacherBackButtonProps) {
  const router = useRouter();

  const goBack = () => {
    startTopNavLoader();
    const historyIdx =
      typeof window !== "undefined"
        ? (window.history.state as { idx?: number } | null)?.idx
        : undefined;

    if (typeof historyIdx === "number" && historyIdx > 0) {
      router.back();
      return;
    }

    router.push(fallbackHref);
  };

  return (
    <button
      type="button"
      onClick={goBack}
      className={cn(
        "inline-flex size-10 shrink-0 items-center justify-center rounded-full",
        "border border-border/70 bg-muted/40 text-foreground shadow-sm",
        "transition-colors hover:bg-muted active:scale-[0.98]",
        "dark:border-slate-600 dark:bg-slate-800/80 dark:text-white",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/30",
        className
      )}
      aria-label="رجوع"
      {...spekit(SPEKIT.teacherHeaderBack)}
    >
      <ArrowRight className="size-5" aria-hidden />
    </button>
  );
}
