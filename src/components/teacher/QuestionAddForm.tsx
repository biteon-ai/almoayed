"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CorrectAnswerPicker } from "@/components/teacher/CorrectAnswerPicker";
import type { ArabicOptionLetter } from "@/lib/question-options";
import { cn } from "@/lib/utils";
import { SPEKIT, spekit } from "@/lib/spekit-targets";

const fieldClass =
  "h-11 min-h-[44px] bg-muted/40 px-4 text-start text-sm shadow-none";

const optionLabels = [
  { id: "option_a", letter: "أ", name: "option_a" },
  { id: "option_b", letter: "ب", name: "option_b" },
  { id: "option_c", letter: "ج", name: "option_c" },
  { id: "option_d", letter: "د", name: "option_d" },
] as const;

interface QuestionAddFormProps {
  action: (formData: FormData) => void | Promise<void>;
}

export function QuestionAddForm({ action }: QuestionAddFormProps) {
  const [correctAnswer, setCorrectAnswer] =
    useState<ArabicOptionLetter>("أ");

  return (
    <form action={action} className="space-y-6" {...spekit(SPEKIT.manualQuestionForm)}>
      <div className="space-y-2">
        <Label
          htmlFor="question_text"
          className="text-sm font-medium text-muted-foreground"
        >
          نص السؤال
        </Label>
        <Input
          id="question_text"
          name="question_text"
          required
          className={fieldClass}
        />
      </div>

      <div className="space-y-3">
        <Label className="text-sm font-medium text-muted-foreground">
          خيارات الإجابة
        </Label>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {optionLabels.map((option) => (
            <div key={option.id} className="space-y-2">
              <Label
                htmlFor={option.id}
                className="text-xs font-semibold text-muted-foreground"
              >
                {"الخيار "}
                {option.letter}
              </Label>
              <div className="relative">
                <span className="pointer-events-none absolute inset-y-0 start-3 flex items-center text-sm font-bold text-brand-700">
                  {option.letter}
                </span>
                <Input
                  id={option.id}
                  name={option.name}
                  required
                  placeholder={`نص الخيار ${option.letter}`}
                  className={cn(fieldClass, "ps-9")}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      <CorrectAnswerPicker
        name="correct_answer"
        value={correctAnswer}
        onChange={setCorrectAnswer}
      />

      <div className="space-y-2">
        <Label
          htmlFor="explanation_text"
          className="text-sm font-medium text-muted-foreground"
        >
          الشرح
        </Label>
        <Input
          id="explanation_text"
          name="explanation_text"
          placeholder="شرح الإجابة للطالب بعد التسليم"
          className={fieldClass}
        />
      </div>

      <div className="space-y-2">
        <Label
          htmlFor="category_tag"
          className="text-sm font-medium text-muted-foreground"
        >
          القسم
        </Label>
        <Input
          id="category_tag"
          name="category_tag"
          placeholder="مثال: أشعة"
          defaultValue="عام"
          className={fieldClass}
        />
      </div>

      <Button
        type="submit"
        variant="brand"
        size="lg"
        className="h-12 w-full active:scale-[0.98]"
      >
        إضافة السؤال
      </Button>
    </form>
  );
}
