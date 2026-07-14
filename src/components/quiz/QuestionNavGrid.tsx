"use client";

import { cn } from "@/lib/utils";
import type { QuizSubmitResult } from "@/types/database";

export type QuestionNavStatus =
  | "default"
  | "answered"
  | "active"
  | "correct"
  | "wrong"
  | "unanswered-review";

interface QuestionNavGridProps {
  count: number;
  activeIndex: number;
  isSubmitted: boolean;
  answers: Record<string, string>;
  questionIds: string[];
  results: QuizSubmitResult | null;
  onNavigate: (index: number) => void;
}

function getQuestionStatus(
  index: number,
  activeIndex: number,
  questionId: string,
  isSubmitted: boolean,
  answers: Record<string, string>,
  results: QuizSubmitResult | null
): QuestionNavStatus {
  if (index === activeIndex) return "active";

  if (isSubmitted && results) {
    const answer = results.answers.find((a) => a.questionId === questionId);
    if (!answer) return "unanswered-review";
    return answer.isCorrect ? "correct" : "wrong";
  }

  if (answers[questionId]) return "answered";
  return "default";
}

const statusStyles: Record<QuestionNavStatus, string> = {
  default:
    "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50",
  answered:
    "border-brand-200 bg-brand-50 text-brand-700 hover:border-brand-300",
  active:
    "border-brand-500 bg-brand-600 text-white shadow-md ring-2 ring-brand-200 ring-offset-1",
  correct:
    "border-green-200 bg-green-50 text-green-700",
  wrong:
    "border-red-200 bg-red-50 text-red-700",
  "unanswered-review":
    "border-slate-200 bg-slate-50 text-slate-500",
};

export function QuestionNavGrid({
  count,
  activeIndex,
  isSubmitted,
  answers,
  questionIds,
  results,
  onNavigate,
}: QuestionNavGridProps) {
  if (count === 0) return null;

  return (
    <div className="grid grid-cols-5 gap-2 sm:grid-cols-6 md:grid-cols-4 lg:grid-cols-5">
      {Array.from({ length: count }, (_, index) => {
        const status = getQuestionStatus(
          index,
          activeIndex,
          questionIds[index] ?? "",
          isSubmitted,
          answers,
          results
        );

        return (
          <button
            key={questionIds[index] ?? index}
            type="button"
            onClick={() => onNavigate(index)}
            aria-label={`السؤال ${index + 1}`}
            aria-current={index === activeIndex ? "step" : undefined}
            className={cn(
              "flex size-10 items-center justify-center rounded-xl border text-sm font-bold transition-all duration-200",
              "active:scale-95",
              statusStyles[status]
            )}
          >
            {index + 1}
          </button>
        );
      })}
    </div>
  );
}
