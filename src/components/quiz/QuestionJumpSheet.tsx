"use client";

import { LayoutGrid, X } from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { QuestionNavGrid } from "@/components/quiz/QuestionNavGrid";
import { SPEKIT, spekit } from "@/lib/spekit-targets";
import { cn } from "@/lib/utils";
import type { QuizSubmitResult } from "@/types/database";

export function QuestionJumpSheet({
  open,
  onOpenChange,
  count,
  activeIndex,
  isSubmitted,
  answers,
  questionIds,
  results,
  onNavigate,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  count: number;
  activeIndex: number;
  isSubmitted: boolean;
  answers: Record<string, string>;
  questionIds: string[];
  results: QuizSubmitResult | null;
  onNavigate: (index: number) => void;
}) {
  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      className={cn(
        "inset-x-0 bottom-16 top-auto m-0 max-h-[min(80vh,28rem)] w-full max-w-none",
        "rounded-t-3xl rounded-b-none md:bottom-auto md:top-auto md:m-auto md:max-w-md md:rounded-3xl"
      )}
    >
      <DialogContent className="space-y-4 p-5" {...spekit(SPEKIT.quizJumpSheet)}>
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2 text-start">
            <span className="flex size-11 items-center justify-center rounded-2xl bg-brand-500/15 text-brand-700">
              <LayoutGrid className="size-5" aria-hidden />
            </span>
            <h2 className="text-base font-black">كل الأسئلة</h2>
          </div>
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-xl hover:bg-muted"
            aria-label="إغلاق"
          >
            <X className="size-5" aria-hidden />
          </button>
        </div>
        <QuestionNavGrid
          count={count}
          activeIndex={activeIndex}
          isSubmitted={isSubmitted}
          answers={answers}
          questionIds={questionIds}
          results={results}
          onNavigate={(index) => {
            onNavigate(index);
            onOpenChange(false);
          }}
        />
      </DialogContent>
    </Dialog>
  );
}
