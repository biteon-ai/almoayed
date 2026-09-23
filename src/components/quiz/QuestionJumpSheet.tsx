"use client";

import { LayoutGrid, X } from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { QuestionNavGrid } from "@/components/quiz/QuestionNavGrid";
import { SPEKIT, spekit } from "@/lib/spekit-targets";
import { cn } from "@/lib/utils";
import type { QuizSubmitResult } from "@/types/database";

/**
 * Question jump bottom sheet (UI-018).
 * Uses a full-viewport transparent `<dialog>` shell with an inner panel —
 * same pattern as QuestionEditDialog — so mobile Safari/Chrome don't fight
 * native modal centering when positioning the dialog element itself.
 */
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
        // Full-bleed top-layer shell (not the sheet itself)
        "inset-0 m-0 h-dvh max-h-none w-full max-w-none border-0 bg-transparent p-0 shadow-none",
        "open:flex open:items-end open:justify-center sm:open:items-center",
        "backdrop:bg-black/60"
      )}
    >
      <DialogContent
        className={cn(
          "relative z-10 flex w-full max-h-[min(78vh,36rem)] flex-col gap-0 overflow-hidden p-0",
          "rounded-t-3xl rounded-b-none border border-border/80 border-b-0 bg-card shadow-2xl",
          "dark:border-slate-700 dark:bg-slate-950 dark:text-slate-50",
          "sm:max-h-[min(80vh,40rem)] sm:w-[min(100%-2rem,24rem)] sm:max-w-sm",
          "sm:rounded-2xl sm:border-b sm:shadow-xl",
          "animate-slide-up"
        )}
        {...spekit(SPEKIT.quizJumpSheet)}
        onClick={(event) => event.stopPropagation()}
        onPointerDown={(event) => event.stopPropagation()}
      >
        <div className="flex shrink-0 justify-center pt-2.5 sm:hidden" aria-hidden>
          <span className="h-1 w-10 rounded-full bg-muted-foreground/30" />
        </div>

        <div className="relative flex shrink-0 items-center justify-between gap-3 px-4 pb-3 pt-2 sm:px-5 sm:pt-5">
          <div className="flex min-w-0 items-center gap-2.5">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-brand-500/15 text-brand-700 dark:text-brand-300">
              <LayoutGrid className="size-5" aria-hidden />
            </span>
            <div className="min-w-0 text-start">
              <h2 className="text-base font-black text-foreground">كل الأسئلة</h2>
              <p className="text-[11px] font-medium text-muted-foreground">
                اضغط للانتقال إلى أي سؤال
              </p>
            </div>
          </div>
          <button
            type="button"
            className={cn(
              "inline-flex size-11 shrink-0 touch-manipulation items-center justify-center rounded-full",
              "text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            )}
            aria-label="إغلاق"
            onClick={() => onOpenChange(false)}
          >
            <X className="size-5" aria-hidden />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 pb-[max(1.25rem,env(safe-area-inset-bottom))] sm:px-5 sm:pb-5">
          <QuestionNavGrid
            className="mx-auto w-full max-w-sm grid-cols-5 sm:grid-cols-6"
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
        </div>
      </DialogContent>
    </Dialog>
  );
}
