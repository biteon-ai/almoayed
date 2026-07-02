"use client";

import Image from "next/image";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import type { ExamQuestion } from "@/types/database";
import { cn } from "@/lib/utils";

interface QuestionCardProps {
  question: ExamQuestion;
  index: number;
  value?: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  showResult?: boolean;
  correctAnswer?: string;
  categoryTag?: string;
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
}: QuestionCardProps) {
  return (
    <Card className="overflow-hidden border-brand-100/80">
      <CardHeader className="flex-row items-start justify-between gap-2 space-y-0 pb-3">
        <Badge variant="secondary" className="shrink-0">
          سؤال {index + 1}
        </Badge>
        {showResult && categoryTag && (
          <Badge variant="outline" className="text-xs">
            {categoryTag}
          </Badge>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-base leading-relaxed">{question.question_text}</p>

        {question.question_image_url && (
          <div className="relative aspect-video w-full overflow-hidden rounded-lg bg-muted">
            <Image
              src={question.question_image_url}
              alt={`سؤال ${index + 1}`}
              fill
              className="object-contain"
              sizes="(max-width: 640px) 100vw, 640px"
              loading="lazy"
            />
          </div>
        )}

        <RadioGroup
          value={value}
          onValueChange={onChange}
          disabled={disabled}
          className="gap-2"
        >
          {question.options.map((option, optIdx) => {
            const letter = String.fromCharCode(65 + optIdx);
            const isSelected = value === option;
            const isCorrect = showResult && option === correctAnswer;
            const isWrong =
              showResult && isSelected && option !== correctAnswer;

            return (
              <div
                key={option}
                className={cn(
                  "flex items-center gap-3 rounded-lg border p-3 transition-colors",
                  isCorrect && "border-green-500 bg-green-50 dark:bg-green-950/30",
                  isWrong && "border-red-400 bg-red-50 dark:bg-red-950/30",
                  !showResult && isSelected && "border-brand-500 bg-brand-50 dark:bg-brand-950/20"
                )}
              >
                <RadioGroupItem
                  value={option}
                  id={`q${question.id}-${optIdx}`}
                  disabled={disabled}
                />
                <Label
                  htmlFor={`q${question.id}-${optIdx}`}
                  className="flex flex-1 cursor-pointer items-center gap-2 font-normal"
                >
                  <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-semibold">
                    {letter}
                  </span>
                  <span className="flex-1">{option}</span>
                </Label>
              </div>
            );
          })}
        </RadioGroup>
      </CardContent>
    </Card>
  );
}
