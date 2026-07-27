"use client";

import type { AssessmentCategory } from "@/types/database";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import { Check } from "lucide-react";

const CATEGORY_OPTIONS: {
  value: AssessmentCategory;
  label: string;
  shortLabel: string;
  description: string;
  emoji: string;
}[] = [
  {
    value: "practice",
    emoji: "📘",
    label: "تدريب / واجب",
    shortLabel: "تدريب / واجب",
    description: "محاولات متعددة لتعزيز التعلم.",
  },
  {
    value: "evaluation",
    emoji: "🏆",
    label: "اختبار تقييمي / نصفي",
    shortLabel: "اختبار تقييمي",
    description: "تقييم محدد لقياس المستوى.",
  },
  {
    value: "challenge",
    emoji: "⚡",
    label: "تحدي / مسابقة",
    shortLabel: "تحدي / مسابقة",
    description: "منافسة سريعة بين الطلاب.",
  },
];

export function QuizAttemptSettingsFields({
  category,
  unlimited,
  maxAttempts,
  error,
  idPrefix = "quiz-attempt",
  showSectionTitle = false,
  variant = "default",
  onCategoryChange,
  onUnlimitedChange,
  onMaxAttemptsChange,
}: {
  category: AssessmentCategory;
  unlimited: boolean;
  maxAttempts: string;
  customized: boolean;
  error: string | null;
  idPrefix?: string;
  showSectionTitle?: boolean;
  variant?: "default" | "compact";
  onCategoryChange: (category: AssessmentCategory) => void;
  onUnlimitedChange: (unlimited: boolean) => void;
  onMaxAttemptsChange: (value: string) => void;
}) {
  const compact = variant === "compact";

  return (
    <div className={cn(compact ? "space-y-3" : "space-y-5")}>
      {showSectionTitle ? (
        <div className="space-y-1.5 text-start">
          <p className="text-base font-bold text-foreground">
            نوع الاختبار والمحاولات
          </p>
          <p className="text-xs leading-relaxed text-muted-foreground">
            حدّد تصنيف الاختبار وعدد المحاولات المسموحة لكل طالب
          </p>
        </div>
      ) : null}

      <div className="space-y-2 text-start">
        {!compact ? (
          <Label className="text-sm font-medium">نوع الاختبار</Label>
        ) : null}
        <div
          className={cn(
            compact
              ? "flex gap-1.5"
              : "grid grid-cols-1 gap-2 sm:grid-cols-3"
          )}
          role="group"
          aria-label="نوع الاختبار"
        >
          {CATEGORY_OPTIONS.map((option) => {
            const selected = category === option.value;
            const displayLabel = compact ? option.shortLabel : option.label;

            if (compact) {
              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => onCategoryChange(option.value)}
                  className={cn(
                    "flex min-w-0 flex-1 flex-col items-center gap-1 rounded-xl border px-1.5 py-2.5 transition-all",
                    selected
                      ? "border-emerald-600 bg-emerald-500/10 ring-1 ring-emerald-600/20"
                      : "border-border bg-background hover:border-emerald-500/30"
                  )}
                >
                  <span className="text-sm leading-none" aria-hidden>
                    {option.emoji}
                  </span>
                  <span className="w-full truncate text-center text-[10px] font-bold leading-tight text-foreground">
                    {displayLabel}
                  </span>
                  {selected ? (
                    <Check
                      className="size-3 text-emerald-600"
                      aria-hidden
                    />
                  ) : (
                    <span className="size-3" aria-hidden />
                  )}
                </button>
              );
            }

            return (
              <button
                key={option.value}
                type="button"
                onClick={() => onCategoryChange(option.value)}
                className={cn(
                  "rounded-lg border p-3 text-start transition-colors",
                  selected
                    ? "border-brand-500 bg-brand-50 dark:bg-brand-950/40"
                    : "border-slate-200 bg-slate-50 hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900/50 dark:hover:border-slate-700"
                )}
              >
                <div className="flex items-start justify-between gap-2">
                  <span className="flex min-w-0 items-center gap-1.5">
                    <span className="text-sm leading-none" aria-hidden>
                      {option.emoji}
                    </span>
                    <span
                      className={cn(
                        "text-xs font-bold leading-snug",
                        selected
                          ? "text-brand-800 dark:text-brand-200"
                          : "text-foreground"
                      )}
                    >
                      {displayLabel}
                    </span>
                  </span>
                  {selected ? (
                    <Check
                      className="size-3.5 shrink-0 text-brand-700 dark:text-brand-300"
                      aria-hidden
                    />
                  ) : null}
                </div>
                <p className="mt-1.5 text-[11px] leading-relaxed text-muted-foreground">
                  {option.description}
                </p>
              </button>
            );
          })}
        </div>
      </div>

      {compact ? (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-900/50">
          <Label
            htmlFor={`${idPrefix}-unlimited`}
            className="cursor-pointer text-xs font-semibold text-foreground"
          >
            عدد المحاولات
          </Label>
          <div className="flex items-center gap-2">
            {!unlimited ? (
              <Input
                id={`${idPrefix}-max`}
                type="number"
                min={1}
                max={10}
                value={maxAttempts}
                onChange={(e) => onMaxAttemptsChange(e.target.value)}
                className="h-8 w-14 rounded-lg px-1 text-center text-xs font-bold"
                dir="ltr"
                inputMode="numeric"
                aria-label="أقصى عدد محاولات"
              />
            ) : null}
            <span className="text-[11px] font-bold text-muted-foreground">
              {unlimited ? "غير محدود" : "محدد"}
            </span>
            <Switch
              id={`${idPrefix}-unlimited`}
              checked={unlimited}
              onCheckedChange={(checked) => onUnlimitedChange(checked === true)}
              aria-label="غير محدود"
            />
          </div>
        </div>
      ) : (
        <>
          <div className="flex items-center justify-between gap-4 rounded-lg border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900/50">
            <div className="min-w-0 space-y-0.5 text-start">
              <Label
                htmlFor={`${idPrefix}-unlimited`}
                className="cursor-pointer text-sm font-semibold text-foreground"
              >
                عدد المحاولات المسموحة
              </Label>
              <p className="text-[11px] text-muted-foreground">
                {unlimited
                  ? "يمكن للطالب إعادة الاختبار بدون حد"
                  : "تحديد كم مرة يستطيع الطالب إعادة الاختبار"}
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-2.5">
              <span className="text-[11px] font-bold text-muted-foreground">
                {unlimited ? "غير محدود" : "محدد"}
              </span>
              <Switch
                id={`${idPrefix}-unlimited`}
                checked={unlimited}
                onCheckedChange={(checked) =>
                  onUnlimitedChange(checked === true)
                }
                aria-label="غير محدود"
              />
            </div>
          </div>

          {!unlimited ? (
            <div className="space-y-2 text-start">
              <Label
                htmlFor={`${idPrefix}-max`}
                className="text-sm font-medium"
              >
                أقصى عدد محاولات
              </Label>
              <div className="inline-flex max-w-[14rem] overflow-hidden rounded-xl border border-input bg-background shadow-xs">
                <Input
                  id={`${idPrefix}-max`}
                  type="number"
                  min={1}
                  max={10}
                  value={maxAttempts}
                  onChange={(e) => onMaxAttemptsChange(e.target.value)}
                  className="h-11 min-w-[5rem] flex-1 rounded-none border-0 bg-transparent px-3 text-center font-mono tabular-nums shadow-none focus-visible:ring-0"
                  dir="ltr"
                  inputMode="numeric"
                  aria-label="أقصى عدد محاولات"
                />
                <div
                  className="flex shrink-0 items-center border-s border-input bg-muted/50 px-3.5 text-xs font-bold text-muted-foreground"
                  aria-hidden
                >
                  {Number.parseInt(maxAttempts, 10) === 1 ? "محاولة" : "محاولات"}
                </div>
              </div>
              <p className="text-[11px] text-muted-foreground">
                بين 1 و 10 محاولات. للاختبارات الرسمية: محاولة واحدة.
              </p>
            </div>
          ) : null}
        </>
      )}

      {error ? (
        <p className="text-xs font-semibold text-destructive" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
