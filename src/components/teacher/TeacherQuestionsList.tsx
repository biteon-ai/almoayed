"use client";

import { useRouter } from "next/navigation";
import type { Question } from "@/types/database";
import { QuestionEditDialog } from "@/components/teacher/QuestionEditDialog";
import { MathText } from "@/components/ui/MathText";
import { Card, CardContent } from "@/components/ui/card";
import { SPEKIT } from "@/lib/spekit-targets";

interface TeacherQuestionsListProps {
  quizId: string;
  questions: Question[];
}

export function TeacherQuestionsList({
  quizId,
  questions,
}: TeacherQuestionsListProps) {
  const router = useRouter();

  const handleSaved = () => {
    router.refresh();
  };

  return (
    <div className="space-y-3" data-spekit={SPEKIT.teacherQuestionsList}>
      <h2 className="text-start text-base font-semibold">
        الأسئلة ({questions.length})
      </h2>
      {questions.length === 0 && (
        <Card className="border-border/70 shadow-sm">
          <CardContent className="p-6 text-center text-sm text-muted-foreground">
            ما في أسئلة بعد. أضف يدوياً أو استورد ملفاً.
          </CardContent>
        </Card>
      )}
      {questions.map((question, index) => (
        <Card
          key={question.id}
          className="border-border/70 shadow-sm"
          data-spekit={SPEKIT.questionListItem}
        >
          <CardContent className="space-y-3 p-5 text-start">
            <div className="flex items-start justify-between gap-3">
              <p className="min-w-0 flex-1 text-sm font-medium leading-relaxed">
                <span className="text-brand-700">{index + 1}.</span>{" "}
                <MathText text={question.question_text} />
              </p>
              <QuestionEditDialog
                quizId={quizId}
                question={question}
                index={index}
                onSaved={handleSaved}
              />
            </div>

            {question.options.length > 0 && (
              <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {question.options.map((option, optionIndex) => {
                  const letters = ["أ", "ب", "ج", "د"];
                  const letter = letters[optionIndex] ?? "?";
                  const isCorrect =
                    question.correct_answer === letter ||
                    question.correct_answer === option;
                  return (
                    <li
                      key={`${question.id}-opt-${optionIndex}`}
                      className={`rounded-lg px-3 py-2 text-xs ${
                        isCorrect
                          ? "border border-emerald-200/80 bg-emerald-50/60 font-semibold text-emerald-900 dark:border-emerald-900/40 dark:bg-emerald-950/30 dark:text-emerald-100"
                          : "bg-muted/30 text-foreground/90"
                      }`}
                    >
                      <span className="font-bold text-brand-700">{letter}</span>{" "}
                      <MathText text={option} className="font-mono" />
                    </li>
                  );
                })}
              </ul>
            )}

            <p className="text-xs text-muted-foreground">
              الإجابة: {question.correct_answer}
              {question.category_tag ? ` — ${question.category_tag}` : ""}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
