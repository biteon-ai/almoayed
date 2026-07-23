"use client";

import { Check, CheckCircle2 } from "lucide-react";
import type { ArabicOptionLetter } from "@/lib/question-options";
import { cn } from "@/lib/utils";

const OPTIONS: { value: ArabicOptionLetter; label: string }[] = [
  { value: "أ", label: "الخيار أ" },
  { value: "ب", label: "الخيار ب" },
  { value: "ج", label: "الخيار ج" },
  { value: "د", label: "الخيار د" },
];

interface CorrectAnswerPickerProps {
  value: ArabicOptionLetter;
  onChange: (value: ArabicOptionLetter) => void;
  /** Hidden input name for native form posts (optional). */
  name?: string;
  disabled?: boolean;
  className?: string;
}

/**
 * Interactive correct-answer cards (أ–د) — buttons only, no text caret/focus.
 */
export function CorrectAnswerPicker({
  value,
  onChange,
  name,
  disabled,
  className,
}: CorrectAnswerPickerProps) {
  return (
    <div className={cn("space-y-2 text-start", className)} dir="rtl">
      {name ? <input type="hidden" name={name} value={value} /> : null}

      <p className="flex items-center gap-1.5 text-sm font-semibold text-foreground">
        <CheckCircle2 className="size-4 text-emerald-600" aria-hidden />
        <span>الإجابة الصحيحة *</span>
      </p>

      <div
        role="radiogroup"
        aria-label="الإجابة الصحيحة"
        className="grid grid-cols-2 gap-2 sm:grid-cols-4 sm:gap-3"
      >
        {OPTIONS.map((option) => {
          const isSelected = value === option.value;
          return (
            <button
              key={option.value}
              type="button"
              role="radio"
              aria-checked={isSelected}
              disabled={disabled}
              onClick={() => onChange(option.value)}
              className={cn(
                "flex h-10 select-none items-center justify-center gap-1.5 rounded-xl border text-xs font-semibold transition-all sm:text-sm",
                "focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-emerald-500/25",
                "disabled:pointer-events-none disabled:opacity-50",
                isSelected
                  ? "border-emerald-600 bg-emerald-50 text-emerald-700 shadow-sm dark:bg-emerald-950/40 dark:text-emerald-300"
                  : "border-input bg-card text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              )}
            >
              {isSelected ? (
                <Check
                  className="size-3.5 shrink-0 text-emerald-600"
                  aria-hidden
                />
              ) : null}
              <span>{option.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
