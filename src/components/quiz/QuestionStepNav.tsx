"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SPEKIT, spekit } from "@/lib/spekit-targets";

export function QuestionStepNav({
  activeIndex,
  questionCount,
  canPrev,
  canNext,
  onPrev,
  onNext,
}: {
  activeIndex: number;
  questionCount: number;
  canPrev: boolean;
  canNext: boolean;
  onPrev: () => void;
  onNext: () => void;
}) {
  if (questionCount === 0) return null;

  return (
    <div
      dir="ltr"
      className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-2"
    >
      <Button
        type="button"
        variant="outline"
        dir="ltr"
        className="min-h-11 w-full min-w-0 justify-center gap-1.5 rounded-xl font-bold"
        disabled={!canNext}
        onClick={onNext}
        {...spekit(SPEKIT.quizStepNext)}
      >
        <ChevronLeft className="size-4" aria-hidden />
        التالي
      </Button>
      <span className="min-w-[3.5rem] text-center text-xs font-bold tabular-nums text-muted-foreground">
        {activeIndex + 1} / {questionCount}
      </span>
      <Button
        type="button"
        variant="outline"
        dir="ltr"
        className="min-h-11 w-full min-w-0 justify-center gap-1.5 rounded-xl font-bold"
        disabled={!canPrev}
        onClick={onPrev}
        {...spekit(SPEKIT.quizStepPrev)}
      >
        السابق
        <ChevronRight className="size-4" aria-hidden />
      </Button>
    </div>
  );
}
