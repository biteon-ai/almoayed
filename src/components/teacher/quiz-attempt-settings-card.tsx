"use client";

import { useCallback, useMemo, useState, useTransition } from "react";
import { updateQuizAttemptSettings } from "@/actions/teacher";
import { HubToast } from "@/components/teacher/HubToast";
import { QuizAttemptSettingsFields } from "@/components/teacher/QuizAttemptSettingsFields";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { AssessmentCategory } from "@/types/database";
import {
  ASSESSMENT_CATEGORY_LABELS,
  categoryDefaultMaxAttempts,
  validateMaxAttempts,
} from "@/lib/quiz-attempts";
import { SPEKIT, spekit } from "@/lib/spekit-targets";
import { cn } from "@/lib/utils";
import { Layers, Loader2 } from "lucide-react";

interface QuizAttemptSettingsCardProps {
  quizId: string;
  initialCategory: AssessmentCategory;
  initialMaxAttempts: number;
}

export function QuizAttemptSettingsCard({
  quizId,
  initialCategory,
  initialMaxAttempts,
}: QuizAttemptSettingsCardProps) {
  const [category, setCategory] =
    useState<AssessmentCategory>(initialCategory);
  const [unlimited, setUnlimited] = useState(initialMaxAttempts === 0);
  const [maxAttempts, setMaxAttempts] = useState(
    initialMaxAttempts === 0 ? "3" : String(initialMaxAttempts)
  );
  const [customized, setCustomized] = useState(true);
  const [saved, setSaved] = useState({
    category: initialCategory,
    maxAttempts: initialMaxAttempts,
  });
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const validation = useMemo(
    () =>
      validateMaxAttempts({
        unlimited,
        value: unlimited ? 0 : maxAttempts,
      }),
    [unlimited, maxAttempts]
  );

  const resolvedMax = validation.ok ? validation.value : saved.maxAttempts;

  const isDirty =
    category !== saved.category || resolvedMax !== saved.maxAttempts;

  const statusLabel =
    resolvedMax === 0
      ? `${ASSESSMENT_CATEGORY_LABELS[category]} — غير محدود`
      : `${ASSESSMENT_CATEGORY_LABELS[category]} — ${resolvedMax} ${resolvedMax === 1 ? "محاولة" : "محاولات"}`;

  const handleCategoryChange = useCallback((next: AssessmentCategory) => {
    setCategory(next);
    setCustomized(false);
    const def = categoryDefaultMaxAttempts(next);
    setUnlimited(def === 0);
    setMaxAttempts(def === 0 ? "3" : String(def));
  }, []);

  const handleSave = useCallback(() => {
    setError(null);
    if (!validation.ok) {
      setError(validation.error);
      return;
    }

    startTransition(async () => {
      const result = await updateQuizAttemptSettings(quizId, {
        assessmentCategory: category,
        maxAttempts: validation.value,
      });
      if (!result.ok) {
        setError(result.error ?? "فشل حفظ الإعدادات.");
        return;
      }
      setSaved({ category, maxAttempts: validation.value });
      setToast("تم حفظ نوع الاختبار والمحاولات");
    });
  }, [category, quizId, validation]);

  return (
    <>
      <Card
        className="mb-6 overflow-hidden rounded-xl border-slate-200 p-0 shadow-sm dark:border-slate-800"
        dir="rtl"
        {...spekit(SPEKIT.quizAttemptSettings)}
      >
        <CardHeader className="space-y-0 border-b border-slate-100 bg-slate-50/80 px-6 py-5 dark:border-slate-800 dark:bg-slate-900/40">
          <div className="flex items-start justify-between gap-4">
            <div className="flex min-w-0 items-start gap-3">
              <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-700 dark:bg-brand-950/50 dark:text-brand-300">
                <Layers className="size-5" aria-hidden />
              </span>
              <div className="min-w-0 space-y-1.5 text-start">
                <CardTitle className="text-base font-bold text-foreground">
                  نوع الاختبار والمحاولات
                </CardTitle>
                <CardDescription className="text-xs leading-relaxed text-muted-foreground">
                  حدّد تصنيف الاختبار وعدد المحاولات المسموحة لكل طالب
                </CardDescription>
              </div>
            </div>
            <Badge
              variant="secondary"
              className={cn(
                "shrink-0 rounded-full px-3 py-1 text-[11px] font-bold",
                "border border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900/50 dark:bg-emerald-950/40 dark:text-emerald-200"
              )}
            >
              {statusLabel}
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="space-y-5 p-6">
          <QuizAttemptSettingsFields
            category={category}
            unlimited={unlimited}
            maxAttempts={maxAttempts}
            customized={customized}
            error={error}
            idPrefix={`edit-attempt-${quizId}`}
            onCategoryChange={handleCategoryChange}
            onUnlimitedChange={(checked) => {
              setCustomized(true);
              setUnlimited(checked);
            }}
            onMaxAttemptsChange={(value) => {
              setCustomized(true);
              setMaxAttempts(value);
            }}
          />

          <Button
            type="button"
            variant="brand"
            className="h-11 gap-2 rounded-xl px-6 font-bold"
            disabled={!isDirty || pending || !validation.ok}
            onClick={handleSave}
          >
            {pending ? (
              <>
                <Loader2 className="size-4 animate-spin" aria-hidden />
                جاري الحفظ...
              </>
            ) : (
              "حفظ إعدادات النوع والمحاولات"
            )}
          </Button>
        </CardContent>
      </Card>

      <HubToast message={toast} onDismiss={() => setToast(null)} />
    </>
  );
}
