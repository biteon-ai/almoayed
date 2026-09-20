"use client";

import { ArrowRight } from "lucide-react";
import { QuizTimerBadge } from "@/components/quiz/QuizTimerBadge";
import { SPEKIT, spekit } from "@/lib/spekit-targets";
import { cn } from "@/lib/utils";

export function QuizPlayerHeader({
  showTimer,
  remainingSeconds,
  onExit,
}: {
  showTimer: boolean;
  remainingSeconds: number;
  onExit: () => void;
}) {
  return (
    <header
      className={cn(
        "sticky top-16 z-30 -mx-4 mb-4 flex items-center gap-2 border-b border-border",
        "bg-background/90 px-3 py-2 backdrop-blur-md md:top-[4.5rem]"
      )}
      {...spekit(SPEKIT.quizPlayerHeader)}
    >
      <button
        type="button"
        onClick={onExit}
        className={cn(
          "inline-flex min-h-11 min-w-11 shrink-0 items-center justify-center gap-1 rounded-xl",
          "text-foreground transition-colors hover:bg-muted"
        )}
        aria-label="خروج"
        {...spekit(SPEKIT.quizExitButton)}
      >
        <ArrowRight className="size-5" aria-hidden />
      </button>
      <div className="min-w-0 flex-1">
        {showTimer ? (
          <QuizTimerBadge remainingSeconds={remainingSeconds} compact />
        ) : (
          <p className="truncate text-start text-sm font-bold text-muted-foreground">
            الاختبار
          </p>
        )}
      </div>
    </header>
  );
}
