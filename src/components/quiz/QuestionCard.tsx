"use client";

import React from "react";
import Image from "next/image";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import type { ExamQuestion } from "@/types/database";
import { cn } from "@/lib/utils";
import { MathText } from "@/components/ui/MathText";
import { Check, X, HelpCircle } from "lucide-react";
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

  // Auto-expand if the student answered incorrectly
  React.useEffect(() => {
    if (showResult && isQuestionWrong) {
      setIsExpanded(true);
    }
  }, [showResult, isQuestionWrong]);

  return (
    <Card
      className={cn(
        "overflow-hidden border bg-white shadow-md transition-all duration-300 animate-slide-up",
        "border-brand-100/60 dark:border-brand-900/30 dark:bg-card/90"
      )}
      {...spekit(SPEKIT.questionCard)}
    >
      {/* Question Card Header */}
      <CardHeader className="flex-row items-center justify-between gap-3 space-y-0 pb-3 bg-gradient-to-l from-brand-50/20 to-transparent px-5 py-4 border-b border-brand-50/20 dark:border-brand-950/20">
        <Badge variant="secondary" className="bg-brand-50 text-brand-800 border border-brand-100 font-bold px-3 py-1 text-xs dark:bg-brand-950/40 dark:text-brand-300 dark:border-brand-900/30">
          السؤال {index + 1}
        </Badge>
        {categoryTag && (
          <Badge variant="outline" className="text-xs font-semibold text-brand-600 border-brand-200/80 bg-brand-50/10 px-2.5 py-0.5 dark:text-brand-400 dark:border-brand-900/40">
            {categoryTag}
          </Badge>
        )}
      </CardHeader>

      <CardContent className="p-5 space-y-5">
        {/* Question Text with Math support */}
        <div className="text-base font-bold text-foreground leading-relaxed text-start">
          <MathText text={question.question_text} />
        </div>

        {/* Question Image (Optional) */}
        {question.question_image_url && (
          <div className="relative aspect-video w-full overflow-hidden rounded-xl border border-brand-100/60 bg-muted dark:border-brand-900/20 shadow-inner">
            <Image
              src={question.question_image_url}
              alt={`توضيح السؤال ${index + 1}`}
              fill
              className="object-contain p-2"
              sizes="(max-width: 640px) 100vw, 640px"
              loading="lazy"
            />
          </div>
        )}

        {/* Selection Options */}
        <RadioGroup
          value={value}
          onValueChange={onChange}
          disabled={disabled}
          className="gap-2.5"
        >
          {question.options.map((option, optIdx) => {
            const letter = String.fromCharCode(65 + optIdx);
            const isSelected = value === option;
            const isCorrect = showResult && option === correctAnswer;
            const isWrong = showResult && isSelected && option !== correctAnswer;

            return (
              <div
                key={option}
                className={cn(
                  "relative flex items-center gap-3.5 rounded-xl border p-4 cursor-pointer transition-all duration-200 active:scale-[0.99]",
                  "hover:border-brand-300 hover:bg-brand-50/10",
                  isSelected && "border-brand-400 bg-brand-50/30 dark:bg-brand-950/20",
                  isCorrect && "border-green-500 bg-green-50/40 dark:border-green-900/30 dark:bg-green-950/20",
                  isWrong && "border-destructive/40 bg-destructive/5 dark:border-destructive/30 dark:bg-destructive/10",
                  disabled && "cursor-default active:scale-100"
                )}
                onClick={() => {
                  if (!disabled) onChange(option);
                }}
              >
                {/* Hidden original radio to keep component standard */}
                <div className="sr-only">
                  <RadioGroupItem
                    value={option}
                    id={`q${question.id}-${optIdx}`}
                    disabled={disabled}
                  />
                </div>

                {/* Option Letter Bubble / Status Indicator */}
                <div
                  className={cn(
                    "flex size-7 shrink-0 items-center justify-center rounded-full font-bold text-xs transition-all",
                    "bg-brand-50 text-brand-700 border border-brand-100 dark:bg-brand-950/60 dark:text-brand-300 dark:border-brand-900/30",
                    isSelected && "bg-brand-600 text-white border-brand-600 dark:bg-brand-500",
                    isCorrect && "bg-green-500 text-white border-green-500 dark:bg-green-600",
                    isWrong && "bg-destructive text-white border-destructive"
                  )}
                >
                  {isCorrect ? (
                    <Check className="size-4 stroke-[3]" />
                  ) : isWrong ? (
                    <X className="size-4 stroke-[3]" />
                  ) : (
                    <span>{letter}</span>
                  )}
                </div>

                {/* Option Content Label */}
                <Label
                  htmlFor={`q${question.id}-${optIdx}`}
                  className={cn(
                    "flex-1 cursor-pointer text-sm font-semibold text-foreground text-start leading-relaxed",
                    disabled && "cursor-default"
                  )}
                  onClick={(e) => {
                    e.preventDefault();
                  }}
                >
                  <MathText text={option} />
                </Label>

                {/* Visual indicator tag on results screen */}
                {showResult && isCorrect && (
                  <span className="text-[10px] font-bold text-green-700 bg-green-100 px-2 py-0.5 rounded-full dark:bg-green-950/60 dark:text-green-400">
                    الإجابة الصحيحة
                  </span>
                )}
                {showResult && isWrong && (
                  <span className="text-[10px] font-bold text-destructive bg-destructive/10 px-2 py-0.5 rounded-full">
                    إجابتك خاطئة
                  </span>
                )}
              </div>
            );
          })}
        </RadioGroup>

        {/* Unlocked Solution Explanation Accordion */}
        {showResult && explanationText && (
          <div className="pt-3 border-t border-brand-100/60 dark:border-brand-900/20 animate-fade-in">
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className={cn(
                "flex w-full items-center justify-between py-2 text-xs font-bold transition-colors",
                isExpanded ? "text-brand-700 dark:text-brand-400" : "text-muted-foreground hover:text-brand-600"
              )}
            >
              <span className="flex items-center gap-1.5">
                <HelpCircle className="size-4 text-brand-500 fill-brand-500/10" />
                <span>شرح الحل التفصيلي</span>
              </span>
              <span className={cn(
                "transition-transform duration-200 text-[10px] bg-brand-50 dark:bg-brand-950/40 px-2.5 py-1 rounded-md",
                isExpanded && "rotate-180"
              )}>
                {isExpanded ? "إخفاء التفاصيل ▲" : "عرض التفاصيل ▼"}
              </span>
            </button>

            {/* Explanation Content Area */}
            <div className={cn(
              "grid transition-all duration-300 ease-in-out overflow-hidden",
              isExpanded ? "grid-rows-[1fr] opacity-100 mt-2.5" : "grid-rows-[0fr] opacity-0"
            )}>
              <div className="overflow-hidden">
                <div className={cn(
                  "p-4 rounded-xl border border-brand-200/60 bg-brand-50/20 text-start space-y-3",
                  "dark:border-brand-900/40 dark:bg-brand-950/10"
                )}>
                  {/* Title banner */}
                  <div className="flex items-center gap-1.5 text-xs font-bold text-brand-850 dark:text-brand-350">
                    <span className="inline-block size-1.5 rounded-full bg-brand-600" />
                    <span>خطوات التفكير والحل العلمي:</span>
                  </div>

                  {/* Math text solution content */}
                  <div className="text-sm leading-relaxed text-foreground/90 font-medium">
                    <MathText text={explanationText} />
                  </div>

                  {/* Explanation Media: image or video (Optional) */}
                  {explanationMediaUrl && (
                    <div className="mt-3 overflow-hidden rounded-xl border border-brand-100/50 bg-white dark:border-brand-900/20 shadow-sm">
                      {/\.(mp4|webm|ogg)$/i.test(explanationMediaUrl) ? (
                        <video
                          src={explanationMediaUrl}
                          controls
                          preload="metadata"
                          className="w-full aspect-video"
                          playsInline
                        />
                      ) : (
                        <div className="relative aspect-video w-full">
                          <Image
                            src={explanationMediaUrl}
                            alt="شرح توضيحي للحل"
                            fill
                            className="object-contain p-1"
                            sizes="(max-width: 640px) 100vw, 640px"
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
      </CardContent>
    </Card>
  );
}
