"use client";

import React from "react";
import Image from "next/image";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import type { ExamQuestion } from "@/types/database";
import { cn } from "@/lib/utils";
import { MathText } from "@/components/ui/MathText";
import { Check, HelpCircle, X } from "lucide-react";
import { optionLetter, QUIZ_CHOICE_SELECTED } from "@/lib/quiz-player";
import { SPEKIT, spekit } from "@/lib/spekit-targets";

interface QuestionCardProps {
  question: ExamQuestion;
  index: number;
  value?: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  showResult?: boolean;
  correctAnswer?: string;
  categoryTag?: string;
  explanationText?: string;
  explanationMediaUrl?: string | null;
}

function WrongBadge() {
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-red-100 bg-red-50 px-2.5 py-0.5 text-[10px] font-bold text-red-600">
      <span className="flex size-4 items-center justify-center rounded-full bg-red-100">
        <X className="size-2.5 stroke-[3]" aria-hidden />
      </span>
      إجابتك خاطئة
    </span>
  );
}

function CorrectBadge() {
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-green-100 bg-green-50 px-2.5 py-0.5 text-[10px] font-bold text-green-600">
      <Check className="size-3 stroke-[3]" aria-hidden />
      الإجابة الصحيحة
    </span>
  );
}

export function QuestionCard({
  question,
  index,
  value,
  onChange,
  disabled,
  showResult,
  correctAnswer,
  categoryTag,
  explanationText,
  explanationMediaUrl,
}: QuestionCardProps) {
  const isQuestionWrong = showResult && value !== correctAnswer;
  const [isExpanded, setIsExpanded] = React.useState(false);

  React.useEffect(() => {
    if (showResult && isQuestionWrong) {
      setIsExpanded(true);
    }
  }, [showResult, isQuestionWrong]);

  return (
    <article
      className="overflow-hidden rounded-2xl border border-border bg-card text-card-foreground shadow-sm"
      {...spekit(SPEKIT.questionCard)}
    >
      <div className="flex flex-wrap items-center justify-start gap-2 border-b border-border px-6 py-4 md:px-8">
        <span className="rounded-full bg-brand-50 px-3 py-1 text-xs font-bold text-brand-800 dark:bg-brand-950/50 dark:text-brand-200">
          السؤال {index + 1}
        </span>
        {showResult && categoryTag ? (
          <span className="rounded-full border border-border bg-muted px-3 py-1 text-xs font-semibold text-muted-foreground">
            {categoryTag}
          </span>
        ) : null}
      </div>

      <div className="space-y-6 p-6 md:p-8">
        <div className="text-start text-lg font-bold leading-relaxed text-foreground md:text-xl">
          <MathText text={question.question_text} />
        </div>

        {question.question_image_url && (
          <div className="relative aspect-video w-full overflow-hidden rounded-2xl border border-slate-100 bg-slate-50">
            <Image
              src={question.question_image_url}
              alt={`توضيح السؤال ${index + 1}`}
              fill
              className="object-contain p-2"
              sizes="(max-width: 768px) 100vw, 672px"
              loading="lazy"
            />
          </div>
        )}

        <RadioGroup
          value={value}
          onValueChange={onChange}
          disabled={disabled}
          className="gap-3"
        >
          {question.options.map((option, optIdx) => {
            const letter = optionLetter(optIdx);
            const isSelected = value === option;
            const isCorrect = showResult && option === correctAnswer;
            const isWrong = showResult && isSelected && option !== correctAnswer;
            const takingSelected = isSelected && !showResult;

            return (
              <div
                key={option}
                className={cn(
                  "flex min-h-11 cursor-pointer items-center justify-between gap-4 rounded-2xl border px-4 py-3 transition-all duration-200",
                  "border-border bg-background hover:border-muted-foreground/30 hover:bg-muted/40",
                  takingSelected && "text-white hover:text-white",
                  isCorrect &&
                    "border-green-200 bg-green-50/70 text-green-900 hover:bg-green-50/70",
                  isWrong &&
                    "border-red-200 bg-red-50/70 text-red-900 hover:bg-red-50/70",
                  disabled && "cursor-default hover:border-border hover:bg-background"
                )}
                style={
                  takingSelected
                    ? {
                        backgroundColor: QUIZ_CHOICE_SELECTED,
                        borderColor: QUIZ_CHOICE_SELECTED,
                      }
                    : undefined
                }
                onClick={() => {
                  if (!disabled) onChange(option);
                }}
              >
                <div className="sr-only">
                  <RadioGroupItem
                    value={option}
                    id={`q${question.id}-${optIdx}`}
                    disabled={disabled}
                  />
                </div>

                <div className="flex min-w-0 flex-1 items-center gap-3">
                  <div
                    className={cn(
                      "flex size-9 shrink-0 items-center justify-center rounded-full text-sm font-semibold transition-colors",
                      "bg-muted text-muted-foreground",
                      takingSelected && "bg-white/15 text-white",
                      isCorrect && "bg-green-500 text-white",
                      isWrong && "bg-red-100 text-red-600"
                    )}
                    style={
                      takingSelected
                        ? { backgroundColor: "rgba(255,255,255,0.18)" }
                        : undefined
                    }
                  >
                    {isCorrect ? (
                      <Check className="size-4 stroke-[3]" aria-hidden />
                    ) : isWrong ? (
                      <X className="size-4 stroke-[3]" aria-hidden />
                    ) : (
                      letter
                    )}
                  </div>

                  <Label
                    htmlFor={`q${question.id}-${optIdx}`}
                    className={cn(
                      "flex-1 cursor-pointer text-start text-sm font-medium leading-relaxed md:text-base",
                      takingSelected ? "text-white" : "text-foreground",
                      disabled && "cursor-default"
                    )}
                    onClick={(e) => e.preventDefault()}
                  >
                    <MathText text={option} />
                  </Label>
                </div>

                {showResult && isCorrect && <CorrectBadge />}
                {showResult && isWrong && <WrongBadge />}
              </div>
            );
          })}
        </RadioGroup>

        {showResult && explanationText && (
          <div className="border-t border-slate-100 pt-4">
            <button
              type="button"
              onClick={() => setIsExpanded(!isExpanded)}
              className={cn(
                "flex w-full items-center justify-between py-2 text-xs font-bold transition-colors",
                isExpanded
                  ? "text-brand-700"
                  : "text-slate-500 hover:text-brand-600"
              )}
            >
              <span className="flex items-center gap-1.5">
                <HelpCircle className="size-4 text-brand-500" />
                شرح الحل التفصيلي
              </span>
              <span className="rounded-md bg-slate-100 px-2.5 py-1 text-[10px]">
                {isExpanded ? "إخفاء ▲" : "عرض ▼"}
              </span>
            </button>

            <div
              className={cn(
                "grid transition-all duration-300 ease-in-out overflow-hidden",
                isExpanded
                  ? "grid-rows-[1fr] opacity-100 mt-3"
                  : "grid-rows-[0fr] opacity-0"
              )}
            >
              <div className="overflow-hidden">
                <div className="space-y-3 rounded-2xl border border-brand-100 bg-brand-50/30 p-5 text-start">
                  <p className="text-xs font-bold text-brand-800">
                    خطوات التفكير والحل العلمي:
                  </p>
                  <div className="text-sm font-medium leading-relaxed text-slate-800">
                    <MathText text={explanationText} />
                  </div>
                  {explanationMediaUrl && (
                    <div className="overflow-hidden rounded-xl border border-slate-100 bg-white">
                      {/\.(mp4|webm|ogg)$/i.test(explanationMediaUrl) ? (
                        <video
                          src={explanationMediaUrl}
                          controls
                          preload="metadata"
                          className="aspect-video w-full"
                          playsInline
                        />
                      ) : (
                        <div className="relative aspect-video w-full">
                          <Image
                            src={explanationMediaUrl}
                            alt="شرح توضيحي للحل"
                            fill
                            className="object-contain p-1"
                            sizes="(max-width: 768px) 100vw, 672px"
                          />
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </article>
  );
}
