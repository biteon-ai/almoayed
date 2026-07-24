"use client";

import { useCallback, useMemo, useState, useTransition } from "react";
import { updateQuizTimerSettings } from "@/actions/teacher";
import { HubToast } from "@/components/teacher/HubToast";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { SPEKIT, spekit } from "@/lib/spekit-targets";
import { validateDurationMinutes } from "@/lib/quiz-timer";
import { cn } from "@/lib/utils";
import { Clock, Loader2 } from "lucide-react";

const PRESET_MINUTES = [15, 30, 45, 60, 90] as const;

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

  const selectedPreset = isTimed
    ? PRESET_MINUTES.find((m) => String(m) === durationMinutes.trim())
    : undefined;

  function applyPreset(minutes: number) {
    setIsTimed(true);
    setDurationMinutes(String(minutes));
    setError(null);
  }

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
          <div className="flex items-center justify-between gap-4 rounded-lg border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900/50">
            <div className="min-w-0 space-y-0.5 text-start">
              <Label
                htmlFor={`edit-is-timed-${quizId}`}
                className="cursor-pointer text-sm font-semibold text-foreground"
              >
                تفعيل التوقيت
              </Label>
              <p className="text-[11px] text-muted-foreground">
                يبدأ العد التنازلي عند فتح الطالب للاختبار
              </p>
            </div>
            <Switch
              id={`edit-is-timed-${quizId}`}
              checked={isTimed}
              onCheckedChange={setIsTimed}
              aria-label="تفعيل التوقيت"
            />
          </div>

          <div
            className={cn(
              "grid transition-all duration-300 ease-in-out",
              isTimed
                ? "grid-rows-[1fr] opacity-100"
                : "grid-rows-[0fr] opacity-0"
            )}
            aria-hidden={!isTimed}
          >
            <div className="overflow-hidden">
              <div className="space-y-4 pt-1">
                <div className="space-y-2 text-start">
                  <Label className="text-sm font-medium">
                    مدة سريعة
                  </Label>
                  <div className="flex flex-wrap gap-2">
                    {PRESET_MINUTES.map((minutes) => (
                      <Button
                        key={minutes}
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={!isTimed || pending}
                        onClick={() => applyPreset(minutes)}
                        className={cn(
                          "h-9 rounded-full px-3.5 text-xs font-bold",
                          selectedPreset === minutes &&
                            "border-brand-500 bg-brand-50 text-brand-800 dark:bg-brand-950/40 dark:text-brand-200"
                        )}
                      >
                        {minutes} دقيقة
                      </Button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2 text-start">
                  <Label htmlFor={`edit-duration-${quizId}`} className="text-sm">
                    مدة مخصصة
                  </Label>
                  <div className="inline-flex max-w-[14rem] overflow-hidden rounded-xl border border-input bg-background shadow-xs">
                    <Input
                      id={`edit-duration-${quizId}`}
                      type="number"
                      min={1}
                      max={180}
                      value={durationMinutes}
                      onChange={(e) => setDurationMinutes(e.target.value)}
                      disabled={!isTimed || pending}
                      className="h-11 min-w-[5rem] flex-1 rounded-none border-0 bg-transparent px-3 font-mono tabular-nums shadow-none focus-visible:ring-0"
                      dir="ltr"
                      inputMode="numeric"
                      aria-describedby={`duration-hint-${quizId}`}
                    />
                    <div
                      className="flex shrink-0 items-center border-s border-input bg-muted/50 px-3.5 text-xs font-bold text-muted-foreground"
                      aria-hidden
                    >
                      دقيقة
                    </div>
                  </div>
                  <p
                    id={`duration-hint-${quizId}`}
                    className="text-[11px] text-muted-foreground"
                  >
                    بين 1 و 180 دقيقة. المحاولات الجارية تحتفظ بالمدة الأصلية.
                  </p>
                </div>
              </div>
            </div>
          </div>

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

/** @deprecated Use QuizTimerCard */
export const QuizTimerSettings = QuizTimerCard;
