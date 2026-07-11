"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createQuiz } from "@/actions/teacher";
import type { Category, TeacherGroup } from "@/types/database";
import { QuizCreateForm } from "@/components/teacher/QuizCreateForm";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface QuizCreateWizardProps {
  categories: Category[];
  groups: TeacherGroup[];
}

export function QuizCreateWizard({ categories, groups }: QuizCreateWizardProps) {
  const router = useRouter();
  const [createError, setCreateError] = useState<string | null>(null);
  const [isCreating, startCreateTransition] = useTransition();

  const handleCreate = (formData: FormData) => {
    setCreateError(null);
    startCreateTransition(async () => {
      try {
        const id = await createQuiz(formData);
        router.push(`/teacher/quizzes/${id}?setup=import`);
      } catch (cause) {
        setCreateError(
          cause instanceof Error
            ? cause.message
            : "فشل إنشاء الاختبار. جرّب مرة تانية."
        );
      }
    });
  };

  return (
    <Card className="overflow-hidden border-border/70 shadow-sm">
      <CardHeader className="space-y-1 p-6 pb-4 text-start">
        <CardTitle className="text-base font-semibold">
          بيانات الاختبار
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6 pt-0">
        {createError && (
          <p
            role="alert"
            className="mb-4 rounded-xl border border-destructive/25 bg-destructive/5 px-3.5 py-3 text-xs font-semibold text-destructive"
          >
            {createError}
          </p>
        )}
        <QuizCreateForm
          categories={categories}
          groups={groups}
          onSubmit={handleCreate}
          isSubmitting={isCreating}
        />
      </CardContent>
    </Card>
  );
}
