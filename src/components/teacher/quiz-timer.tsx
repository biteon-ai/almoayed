"use client";

import { useCallback, useMemo, useState, useTransition } from "react";
import { updateQuizTimerSettings } from "@/actions/teacher";
import { HubToast } from "@/components/teacher/HubToast";
import { QuizTimerSettingsFields } from "@/components/teacher/QuizTimerSettingsFields";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { SPEKIT, spekit } from "@/lib/spekit-targets";
import { validateDurationMinutes } from "@/lib/quiz-timer";
import { cn } from "@/lib/utils";
import { Clock, Loader2 } from "lucide-react";

interface QuizTimerCardProps {
  quizId: string;
  initialIsTimed: boolean;
  initialDurationMinutes: number | null;
}

function snapshot(isTimed: boolean, durationStr: string) {
  if (!isTimed) return { isTimed: false as const, duration: null };
  const parsed = Number.parseInt(durationStr.trim(), 10);
  return {
    isTimed: true as const,
    duration: Number.isFinite(parsed) ? parsed : null,
  };
}

export function QuizTimerCard({
  quizId,
  initialIsTimed,
  initialDurationMinutes,
}: QuizTimerCardProps) {
  const initialDuration = initialDurationMinutes ?? 30;

  const [isTimed, setIsTimed] = useState(initialIsTimed);
  const [durationMinutes, setDurationMinutes] = useState(String(initialDuration));
  const [saved, setSaved] = useState({
    isTimed: initialIsTimed,
    duration: initialIsTimed ? initialDuration : null,
  });
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const dismissToast = useCallback(() => setToast(null), []);

  const current = useMemo(
    () => snapshot(isTimed, durationMinutes),
    [isTimed, durationMinutes]
  );

  const durationValid = useMemo(() => {
    if (!isTimed) return true;
    return validateDurationMinutes(durationMinutes).ok;
  }, [isTimed, durationMinutes]);

  const isDirty = useMemo(() => {
    if (current.isTimed !== saved.isTimed) return true;
    if (!current.isTimed) return false;
    return current.duration !== saved.duration;
  }, [current, saved]);

  const statusLabel = isTimed
    ? `مفعّل — ${durationValid ? durationMinutes : "—"} دقيقة`
    : "غير مفعّل";

  function onSave() {
    if (!isDirty || pending) return;
    setError(null);

    if (isTimed) {
      const validated = validateDurationMinutes(durationMinutes);
      if (!validated.ok) {
        setError(validated.error);
        return;
      }
    }

    startTransition(async () => {
      const parsed = isTimed
        ? validateDurationMinutes(durationMinutes)
        : null;
      const durationValue =
        parsed && parsed.ok ? parsed.value : null;

      const result = await updateQuizTimerSettings(quizId, {
        isTimed,
        durationMinutes: isTimed ? durationValue : null,
      });

      if (!result.ok) {
        setError(result.error);
        setToast(result.error);
        return;
      }

      setSaved({
        isTimed,
        duration: isTimed ? durationValue : null,
      });
      setToast("تم حفظ إعدادات التوقيت بنجاح.");
      setError(null);
    });
  }

  return (
    <>
      <Card
        className="mb-6 overflow-hidden rounded-xl border-slate-200 p-0 shadow-sm dark:border-slate-800"
        dir="rtl"
        {...spekit(SPEKIT.quizTimerCard)}
      >
        <CardHeader className="space-y-0 border-b border-slate-100 bg-slate-50/80 px-6 py-5 dark:border-slate-800 dark:bg-slate-900/40">
          <div className="flex items-start justify-between gap-4">
            <div className="flex min-w-0 items-start gap-3">
              <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-700 dark:bg-brand-950/50 dark:text-brand-300">
                <Clock className="size-5" aria-hidden />
              </span>
              <div className="min-w-0 space-y-1.5 text-start">
                <CardTitle className="text-base font-bold text-foreground">
                  توقيت الاختبار
                </CardTitle>
                <CardDescription className="text-xs leading-relaxed text-muted-foreground">
                  حدد مهلة زمنية لإنجاز الاختبار من قبل الطلاب
                </CardDescription>
              </div>
            </div>
            <Badge
              variant="secondary"
              className={cn(
                "shrink-0 rounded-full px-3 py-1 text-[11px] font-bold",
                isTimed
                  ? "border border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900/50 dark:bg-emerald-950/40 dark:text-emerald-200"
                  : "border border-slate-200 bg-slate-100 text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
              )}
            >
              {statusLabel}
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="space-y-5 p-6">
          <QuizTimerSettingsFields
            quizId={quizId}
            isTimed={isTimed}
            durationMinutes={durationMinutes}
            pending={pending}
            onIsTimedChange={setIsTimed}
            onDurationChange={setDurationMinutes}
            onPreset={(minutes) => {
              setIsTimed(true);
              setDurationMinutes(String(minutes));
              setError(null);
            }}
          />

          {error ? (
            <p className="text-xs font-semibold text-destructive" role="alert">
              {error}
            </p>
          ) : null}

          <Button
            type="button"
            variant="brand"
            className="h-11 gap-2 rounded-xl px-6 font-bold"
            disabled={pending || !isDirty || (isTimed && !durationValid)}
            onClick={onSave}
          >
            {pending ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                جاري الحفظ...
              </>
            ) : (
              "حفظ التوقيت"
            )}
          </Button>
        </CardContent>
      </Card>

      <HubToast
        message={toast}
        tone={error && toast === error ? "error" : "success"}
        onDismiss={dismissToast}
      />
    </>
  );
}

/** @deprecated Use QuizEditSettingsPanel on the quiz edit page */
export const QuizTimerSettings = QuizTimerCard;
