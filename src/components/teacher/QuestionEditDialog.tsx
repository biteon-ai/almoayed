"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import type { Question } from "@/types/database";
import { updateQuestion } from "@/actions/teacher";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MathText } from "@/components/ui/MathText";
import { CorrectAnswerPicker } from "@/components/teacher/CorrectAnswerPicker";
import {
  inferCorrectLetter,
  optionsArrayToFields,
  type ArabicOptionLetter,
} from "@/lib/question-options";
import { cn } from "@/lib/utils";
import { SPEKIT, spekit } from "@/lib/spekit-targets";
import { Loader2, Pencil, X } from "lucide-react";

const fieldClass =
  "h-11 min-h-[44px] bg-muted/40 px-4 text-start text-sm shadow-none";

const optionFields = [
  { key: "option_a" as const, letter: "أ" },
  { key: "option_b" as const, letter: "ب" },
  { key: "option_c" as const, letter: "ج" },
  { key: "option_d" as const, letter: "د" },
];

interface QuestionEditDialogProps {
  quizId: string;
  question: Question;
  index: number;
  onSaved: () => void;
}

export function QuestionEditDialog({
  quizId,
  question,
  index,
  onSaved,
}: QuestionEditDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const initialFields = optionsArrayToFields(question.options);
  const initialCorrect = inferCorrectLetter(
    question.correct_answer,
    question.options
  );

  const [questionText, setQuestionText] = useState(question.question_text);
  const [optionA, setOptionA] = useState(initialFields.option_a);
  const [optionB, setOptionB] = useState(initialFields.option_b);
  const [optionC, setOptionC] = useState(initialFields.option_c);
  const [optionD, setOptionD] = useState(initialFields.option_d);
  const [correctAnswer, setCorrectAnswer] =
    useState<ArabicOptionLetter>(initialCorrect);
  const [explanationText, setExplanationText] = useState(
    question.explanation_text
  );
  const [categoryTag, setCategoryTag] = useState(question.category_tag);

  useEffect(() => {
    if (!open) return;
    const fields = optionsArrayToFields(question.options);
    setQuestionText(question.question_text);
    setOptionA(fields.option_a);
    setOptionB(fields.option_b);
    setOptionC(fields.option_c);
    setOptionD(fields.option_d);
    setCorrectAnswer(
      inferCorrectLetter(question.correct_answer, question.options)
    );
    setExplanationText(question.explanation_text);
    setCategoryTag(question.category_tag);
    setError(null);
  }, [open, question]);

  const openDialog = () => {
    setOpen(true);
    dialogRef.current?.showModal();
  };

  const closeDialog = () => {
    setOpen(false);
    dialogRef.current?.close();
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    const formData = new FormData();
    formData.set("question_text", questionText);
    formData.set("option_a", optionA);
    formData.set("option_b", optionB);
    formData.set("option_c", optionC);
    formData.set("option_d", optionD);
    formData.set("correct_answer", correctAnswer);
    formData.set("explanation_text", explanationText);
    formData.set("category_tag", categoryTag);

    startTransition(async () => {
      try {
        await updateQuestion(quizId, question.id, formData);
        closeDialog();
        onSaved();
      } catch (cause) {
        setError(
          cause instanceof Error
            ? cause.message
            : "فشل حفظ التعديلات. جرّب مرة تانية."
        );
      }
    });
  };

  return (
    <>
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="h-9 gap-1.5 px-3"
        onClick={openDialog}
        data-spekit={SPEKIT.questionEditButton}
      >
        <Pencil className="size-3.5" />
        تحرير
      </Button>

      <dialog
        ref={dialogRef}
        className="fixed inset-0 z-50 m-0 h-full max-h-none w-full max-w-none border-0 bg-transparent p-0 backdrop:bg-black/50 open:flex open:items-end open:justify-center sm:open:items-center"
        onClose={() => setOpen(false)}
        {...spekit(SPEKIT.questionEditDialog)}
      >
        <div className="flex max-h-[min(92vh,720px)] w-full flex-col overflow-hidden rounded-t-2xl border border-border/70 bg-background shadow-xl sm:max-w-lg sm:rounded-2xl">
          <div className="flex items-center justify-between border-b border-border/60 px-5 py-4">
            <h3 className="text-start text-base font-semibold">
              تحرير السؤال {index + 1}
            </h3>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="size-9 p-0"
              onClick={closeDialog}
              aria-label="إغلاق"
            >
              <X className="size-4" />
            </Button>
          </div>

          <form
            onSubmit={handleSubmit}
            className="flex min-h-0 flex-1 flex-col"
            data-spekit={SPEKIT.questionEditForm}
          >
            <div className="space-y-5 overflow-y-auto px-5 py-5 text-start">
              {error && (
                <p
                  role="alert"
                  className="rounded-xl border border-destructive/25 bg-destructive/5 px-3.5 py-3 text-xs font-semibold text-destructive"
                >
                  {error}
                </p>
              )}

              <div className="space-y-2">
                <Label htmlFor={`q-text-${question.id}`}>نص السؤال</Label>
                <Input
                  id={`q-text-${question.id}`}
                  value={questionText}
                  onChange={(e) => setQuestionText(e.target.value)}
                  required
                  className={fieldClass}
                />
                {questionText && (
                  <p className="rounded-lg bg-muted/30 px-3 py-2 text-xs text-muted-foreground">
                    معاينة:{" "}
                    <MathText text={questionText} className="text-foreground" />
                  </p>
                )}
              </div>

              <div className="space-y-3">
                <Label>خيارات الإجابة</Label>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  {optionFields.map(({ key, letter }) => {
                    const valueMap = {
                      option_a: optionA,
                      option_b: optionB,
                      option_c: optionC,
                      option_d: optionD,
                    };
                    const setMap = {
                      option_a: setOptionA,
                      option_b: setOptionB,
                      option_c: setOptionC,
                      option_d: setOptionD,
                    };
                    return (
                      <div key={key} className="space-y-2">
                        <Label
                          htmlFor={`${key}-${question.id}`}
                          className="text-xs font-semibold text-muted-foreground"
                        >
                          {"الخيار "}
                          {letter}
                        </Label>
                        <div className="relative">
                          <span className="pointer-events-none absolute inset-y-0 start-3 flex items-center text-sm font-bold text-brand-700">
                            {letter}
                          </span>
                          <Input
                            id={`${key}-${question.id}`}
                            value={valueMap[key]}
                            onChange={(e) => setMap[key](e.target.value)}
                            required={key === "option_a" || key === "option_b"}
                            className={cn(fieldClass, "ps-9 font-mono text-xs")}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <CorrectAnswerPicker
                value={correctAnswer}
                onChange={setCorrectAnswer}
                disabled={isPending}
              />

              <div className="space-y-2">
                <Label htmlFor={`explain-${question.id}`}>الشرح</Label>
                <Input
                  id={`explain-${question.id}`}
                  value={explanationText}
                  onChange={(e) => setExplanationText(e.target.value)}
                  className={fieldClass}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor={`tag-${question.id}`}>القسم / الوسم</Label>
                <Input
                  id={`tag-${question.id}`}
                  value={categoryTag}
                  onChange={(e) => setCategoryTag(e.target.value)}
                  className={fieldClass}
                />
              </div>
            </div>

            <div className="flex gap-2 border-t border-border/60 px-5 py-4">
              <Button
                type="submit"
                variant="brand"
                className="h-11 flex-1"
                disabled={isPending}
              >
                {isPending ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    جاري الحفظ...
                  </>
                ) : (
                  "حفظ التعديلات"
                )}
              </Button>
              <Button
                type="button"
                variant="outline"
                className="h-11"
                disabled={isPending}
                onClick={closeDialog}
              >
                إلغاء
              </Button>
            </div>
          </form>
        </div>
      </dialog>
    </>
  );
}
