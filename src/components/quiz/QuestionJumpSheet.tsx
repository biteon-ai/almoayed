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
        "inset-0 m-0 h-full max-h-none w-full max-w-none overflow-y-auto border-0 bg-transparent p-4 shadow-none",
        "rounded-none open:flex open:flex-col open:items-center open:justify-center"
      )}
    >
      <button
        type="button"
        tabIndex={-1}
        aria-hidden
        className="absolute inset-0 cursor-default"
        onClick={() => onOpenChange(false)}
      />
      <DialogContent
        className="relative z-10 w-full max-w-sm space-y-4 overflow-visible rounded-2xl border border-border bg-card p-5 shadow-xl"
        {...spekit(SPEKIT.quizJumpSheet)}
      >
        <div className="relative flex items-center justify-center px-11">
          <div className="flex items-center gap-2 text-center">
            <span className="flex size-11 items-center justify-center rounded-2xl bg-brand-500/15 text-brand-700">
              <LayoutGrid className="size-5" aria-hidden />
            </span>
            <h2 className="text-base font-black">كل الأسئلة</h2>
          </div>
          <button
            type="button"
            className="absolute end-0 top-1/2 inline-flex min-h-11 min-w-11 -translate-y-1/2 items-center justify-center rounded-xl hover:bg-muted"
            aria-label="إغلاق"
            onClick={() => onOpenChange(false)}
          >
            <X className="size-5" aria-hidden />
          </button>
        </div>
        <QuestionNavGrid
          className="mx-auto w-fit grid-cols-5 sm:grid-cols-5"
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
