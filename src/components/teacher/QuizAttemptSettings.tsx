"use client";

import { useCallback, useState } from "react";
import type { AssessmentCategory } from "@/types/database";
import {
  categoryDefaultMaxAttempts,
} from "@/lib/quiz-attempts";
import { SPEKIT, spekit } from "@/lib/spekit-targets";
import { QuizAttemptSettingsFields } from "@/components/teacher/QuizAttemptSettingsFields";

export function QuizAttemptSettings() {
  const [category, setCategory] = useState<AssessmentCategory>("practice");
  const [unlimited, setUnlimited] = useState(true);
  const [maxAttempts, setMaxAttempts] = useState("3");
  const [customized, setCustomized] = useState(false);

  const applyCategoryDefault = useCallback((next: AssessmentCategory) => {
    setCategory(next);
    setCustomized(false);
    const def = categoryDefaultMaxAttempts(next);
    setUnlimited(def === 0);
    setMaxAttempts(def === 0 ? "3" : String(def));
  }, []);

  return (
    <div
      className="space-y-3 border-t border-border/50 pt-3"
      {...spekit(SPEKIT.quizAttemptSettings)}
    >
      <input type="hidden" name="assessment_category" value={category} />
      <input
        type="hidden"
        name="max_attempts_unlimited"
        value={unlimited ? "on" : "off"}
      />
      <input
        type="hidden"
        name="max_attempts_customized"
        value={customized ? "on" : "off"}
      />
      {!unlimited ? (
        <input type="hidden" name="max_attempts" value={maxAttempts} />
      ) : null}

      <QuizAttemptSettingsFields
        category={category}
        unlimited={unlimited}
        maxAttempts={maxAttempts}
        customized={customized}
        error={null}
        idPrefix="create-quiz-attempt"
        showSectionTitle
        onCategoryChange={applyCategoryDefault}
        onUnlimitedChange={(checked) => {
          setCustomized(true);
          setUnlimited(checked);
        }}
        onMaxAttemptsChange={(value) => {
          setCustomized(true);
          setMaxAttempts(value);
        }}
      />
    </div>
  );
}
