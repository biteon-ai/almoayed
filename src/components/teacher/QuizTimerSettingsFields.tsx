"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { validateDurationMinutes } from "@/lib/quiz-timer";
import { cn } from "@/lib/utils";

const PRESET_MINUTES = [15, 30, 45, 60, 90] as const;

export function QuizTimerSettingsFields({
  quizId,
  isTimed,
  durationMinutes,
  pending = false,
  compact = false,
  onIsTimedChange,
  onDurationChange,
  onPreset,
}: {
  quizId: string;
  isTimed: boolean;
  durationMinutes: string;
  pending?: boolean;
  compact?: boolean;
  onIsTimedChange: (value: boolean) => void;
  onDurationChange: (value: string) => void;
  onPreset: (minutes: number) => void;
}) {
  const selectedPreset = isTimed
    ? PRESET_MINUTES.find((m) => String(m) === durationMinutes.trim())
    : undefined;

  return (
    <div className={cn("space-y-3", compact && "space-y-3")}>
      <div className="flex items-center justify-between gap-3 rounded-lg border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-900/50">
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
          onCheckedChange={onIsTimedChange}
          aria-label="تفعيل التوقيت"
        />
      </div>

      {isTimed ? (
        <div className="space-y-3 text-start">
          <div className="space-y-2">
            <Label className="text-xs font-medium text-muted-foreground">
              مدة سريعة
            </Label>
            <div className="flex flex-wrap gap-1.5">
              {PRESET_MINUTES.map((minutes) => (
                <Button
                  key={minutes}
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={pending}
                  onClick={() => onPreset(minutes)}
                  className={cn(
                    "h-8 rounded-full px-3 text-xs font-bold",
                    selectedPreset === minutes &&
                      "border-emerald-600 bg-emerald-500/10 text-emerald-800 dark:text-emerald-200"
                  )}
                >
                  {minutes}د
                </Button>
              ))}
            </div>
          </div>

          <div className="flex flex-wrap items-end gap-2">
            <div className="space-y-1.5">
              <Label
                htmlFor={`edit-duration-${quizId}`}
                className="text-xs font-medium text-muted-foreground"
              >
                مدة مخصصة
              </Label>
              <div className="inline-flex overflow-hidden rounded-xl border border-input bg-background shadow-xs">
                <Input
                  id={`edit-duration-${quizId}`}
                  type="number"
                  min={1}
                  max={180}
                  value={durationMinutes}
                  onChange={(e) => onDurationChange(e.target.value)}
                  disabled={pending}
                  className="h-9 w-16 rounded-none border-0 bg-transparent px-2 text-center font-mono text-sm tabular-nums shadow-none focus-visible:ring-0"
                  dir="ltr"
                  inputMode="numeric"
                />
                <div className="flex items-center border-s border-input bg-muted/50 px-2.5 text-[11px] font-bold text-muted-foreground">
                  د
                </div>
              </div>
            </div>
            {!validateDurationMinutes(durationMinutes).ok ? (
              <p className="text-[11px] font-semibold text-destructive">
                بين 1 و 180 دقيقة
              </p>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}

export { PRESET_MINUTES };
