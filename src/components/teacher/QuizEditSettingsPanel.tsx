"use client";

import { useCallback, useMemo, useState, useTransition } from "react";
import {
  updateQuizAttemptSettings,
  updateQuizTimerSettings,
} from "@/actions/teacher";
import { HubToast } from "@/components/teacher/HubToast";
import { QuizAttemptSettingsFields } from "@/components/teacher/QuizAttemptSettingsFields";
import { QuizTimerSettingsFields } from "@/components/teacher/QuizTimerSettingsFields";
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
  categoryDefaultMaxAttempts,
  validateMaxAttempts,
} from "@/lib/quiz-attempts";
import { validateDurationMinutes } from "@/lib/quiz-timer";
import { SPEKIT, spekit } from "@/lib/spekit-targets";
import { Clock, Layers, Loader2, Save } from "lucide-react";

interface QuizEditSettingsPanelProps {
  quizId: string;
  quizTitle: string;
  initialIsTimed: boolean;
  initialDurationMinutes: number | null;
  initialCategory: AssessmentCategory;
  initialMaxAttempts: number;
}

function timerSnapshot(isTimed: boolean, durationStr: string) {
  if (!isTimed) return { isTimed: false as const, duration: null };
  const parsed = Number.parseInt(durationStr.trim(), 10);
  return {
    isTimed: true as const,
    duration: Number.isFinite(parsed) ? parsed : null,
  };
}

export function QuizEditSettingsPanel({
  quizId,
  quizTitle,
  initialIsTimed,
  initialDurationMinutes,
  initialCategory,
  initialMaxAttempts,
}: QuizEditSettingsPanelProps) {
  const initialDuration = initialDurationMinutes ?? 30;

  const [isTimed, setIsTimed] = useState(initialIsTimed);
  const [durationMinutes, setDurationMinutes] = useState(String(initialDuration));
  const [timerSaved, setTimerSaved] = useState({
    isTimed: initialIsTimed,
    duration: initialIsTimed ? initialDuration : null,
  });

  const [category, setCategory] =
    useState<AssessmentCategory>(initialCategory);
  const [unlimited, setUnlimited] = useState(initialMaxAttempts === 0);
  const [maxAttempts, setMaxAttempts] = useState(
    initialMaxAttempts === 0 ? "3" : String(initialMaxAttempts)
  );
  const [customized, setCustomized] = useState(true);
  const [attemptsSaved, setAttemptsSaved] = useState({
    category: initialCategory,
    maxAttempts: initialMaxAttempts,
  });

  const [timerError, setTimerError] = useState<string | null>(null);
  const [attemptError, setAttemptError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [toastTone, setToastTone] = useState<"success" | "error">("success");
  const [pending, startTransition] = useTransition();

  const timerCurrent = useMemo(
    () => timerSnapshot(isTimed, durationMinutes),
    [isTimed, durationMinutes]
  );

  const durationValid = useMemo(() => {
    if (!isTimed) return true;
    return validateDurationMinutes(durationMinutes).ok;
  }, [isTimed, durationMinutes]);

  const attemptValidation = useMemo(
    () =>
      validateMaxAttempts({
        unlimited,
        value: unlimited ? 0 : maxAttempts,
      }),
    [unlimited, maxAttempts]
  );

  const timerDirty = useMemo(() => {
    if (timerCurrent.isTimed !== timerSaved.isTimed) return true;
    if (!timerCurrent.isTimed) return false;
    return timerCurrent.duration !== timerSaved.duration;
  }, [timerCurrent, timerSaved]);

  const attemptsDirty = useMemo(() => {
    const resolvedMax = attemptValidation.ok
      ? attemptValidation.value
      : attemptsSaved.maxAttempts;
    return (
      category !== attemptsSaved.category || resolvedMax !== attemptsSaved.maxAttempts
    );
  }, [attemptValidation, attemptsSaved, category]);

  const isDirty = timerDirty || attemptsDirty;
  const canSave =
    isDirty && durationValid && attemptValidation.ok && !pending;

  const handleCategoryChange = useCallback((next: AssessmentCategory) => {
    setCategory(next);
    setCustomized(false);
    const def = categoryDefaultMaxAttempts(next);
    setUnlimited(def === 0);
    setMaxAttempts(def === 0 ? "3" : String(def));
  }, []);

  const handleSave = useCallback(() => {
    setTimerError(null);
    setAttemptError(null);

    if (!isDirty || pending) return;

    if (isTimed) {
      const validated = validateDurationMinutes(durationMinutes);
      if (!validated.ok) {
        setTimerError(validated.error);
        return;
      }
    }

    if (!attemptValidation.ok) {
      setAttemptError(attemptValidation.error);
      return;
    }

    startTransition(async () => {
      const tasks: Promise<{ ok: boolean; error?: string; kind: "timer" | "attempts" }>[] =
        [];

      if (timerDirty) {
        const parsed = isTimed
          ? validateDurationMinutes(durationMinutes)
          : null;
        const durationValue = parsed && parsed.ok ? parsed.value : null;

        tasks.push(
          updateQuizTimerSettings(quizId, {
            isTimed,
            durationMinutes: isTimed ? durationValue : null,
          }).then((result) => ({ ...result, kind: "timer" as const }))
        );
      }

      if (attemptsDirty) {
        tasks.push(
          updateQuizAttemptSettings(quizId, {
            assessmentCategory: category,
            maxAttempts: attemptValidation.value,
          }).then((result) => ({ ...result, kind: "attempts" as const }))
        );
      }

      const results = await Promise.all(tasks);
      const failed = results.filter((result) => !result.ok);

      if (failed.length > 0) {
        for (const result of failed) {
          if (result.kind === "timer") {
            setTimerError(result.error ?? "فشل حفظ إعدادات التوقيت.");
          } else {
            setAttemptError(result.error ?? "فشل حفظ إعدادات المحاولات.");
          }
        }
        setToastTone("error");
        setToast(failed[0]?.error ?? "فشل حفظ بعض الإعدادات.");
        return;
      }

      if (timerDirty) {
        const parsed = isTimed
          ? validateDurationMinutes(durationMinutes)
          : null;
        setTimerSaved({
          isTimed,
          duration:
            parsed && parsed.ok && isTimed ? parsed.value : null,
        });
      }

      if (attemptsDirty) {
        setAttemptsSaved({
          category,
          maxAttempts: attemptValidation.value,
        });
      }

      setToastTone("success");
      setToast("تم حفظ التغييرات بنجاح.");
    });
  }, [
    attemptValidation,
    attemptsDirty,
    category,
    durationMinutes,
    isDirty,
    isTimed,
    pending,
    quizId,
    timerDirty,
  ]);

  return (
    <>
      <section
        className="mb-6 space-y-4 px-4 pt-4 sm:px-6"
        dir="rtl"
        {...spekit(SPEKIT.quizEditSettingsPanel)}
      >
        <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0 space-y-0.5 text-start">
            <h2 className="text-lg font-bold tracking-tight text-foreground">
              إعدادات الاختبار
            </h2>
            <p className="truncate text-sm text-muted-foreground">{quizTitle}</p>
          </div>
          <Button
            type="button"
            variant="brand"
            className="h-10 shrink-0 gap-2 rounded-xl px-5 text-sm font-bold"
            disabled={!canSave}
            onClick={handleSave}
            {...spekit(SPEKIT.quizEditSettingsSave)}
          >
            {pending ? (
              <>
                <Loader2 className="size-4 animate-spin" aria-hidden />
                جاري الحفظ...
              </>
            ) : (
              <>
                <Save className="size-4" aria-hidden />
                حفظ التغييرات
              </>
            )}
          </Button>
        </header>

        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
          <Card
            className="overflow-hidden rounded-xl border-slate-200 p-0 shadow-sm dark:border-slate-800"
            {...spekit(SPEKIT.quizTimerCard)}
          >
            <CardHeader className="space-y-0 border-b border-slate-100 bg-slate-50/80 px-4 py-3 dark:border-slate-800 dark:bg-slate-900/40">
              <div className="flex items-center gap-2.5 text-start">
                <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-700 dark:bg-brand-950/50 dark:text-brand-300">
                  <Clock className="size-4" aria-hidden />
                </span>
                <div className="min-w-0">
                  <CardTitle className="text-sm font-bold text-foreground">
                    توقيت الاختبار
                  </CardTitle>
                  <CardDescription className="text-[11px] text-muted-foreground">
                    مهلة زمنية لإنجاز الاختبار
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-4">
              <QuizTimerSettingsFields
                quizId={quizId}
                isTimed={isTimed}
                durationMinutes={durationMinutes}
                pending={pending}
                compact
                onIsTimedChange={setIsTimed}
                onDurationChange={setDurationMinutes}
                onPreset={(minutes) => {
                  setIsTimed(true);
                  setDurationMinutes(String(minutes));
                  setTimerError(null);
                }}
              />
              {timerError ? (
                <p
                  className="mt-3 text-xs font-semibold text-destructive"
                  role="alert"
                >
                  {timerError}
                </p>
              ) : null}
            </CardContent>
          </Card>

          <Card
            className="overflow-hidden rounded-xl border-slate-200 p-0 shadow-sm dark:border-slate-800"
            {...spekit(SPEKIT.quizAttemptSettings)}
          >
            <CardHeader className="space-y-0 border-b border-slate-100 bg-slate-50/80 px-4 py-3 dark:border-slate-800 dark:bg-slate-900/40">
              <div className="flex items-center gap-2.5 text-start">
                <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-700 dark:bg-brand-950/50 dark:text-brand-300">
                  <Layers className="size-4" aria-hidden />
                </span>
                <div className="min-w-0">
                  <CardTitle className="text-sm font-bold text-foreground">
                    نوع الاختبار والمحاولات
                  </CardTitle>
                  <CardDescription className="text-[11px] text-muted-foreground">
                    التصنيف وعدد المحاولات لكل طالب
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-4">
              <QuizAttemptSettingsFields
                category={category}
                unlimited={unlimited}
                maxAttempts={maxAttempts}
                customized={customized}
                error={attemptError}
                idPrefix={`edit-attempt-${quizId}`}
                variant="compact"
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
            </CardContent>
          </Card>
        </div>
      </section>

      <HubToast
        message={toast}
        tone={toastTone}
        onDismiss={() => setToast(null)}
      />
    </>
  );
}
