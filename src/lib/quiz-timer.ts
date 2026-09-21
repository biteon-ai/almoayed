/** QUIZ-004 — countdown timer helpers (pure). */

export const QUIZ_TIMER_MIN_MINUTES = 1;
export const QUIZ_TIMER_MAX_MINUTES = 180;
export const QUIZ_TIMER_WARNING_SECONDS = 120;

export type TimedQuizSessionView = {
  startedAt: string;
  durationMinutes: number;
  endsAt: string;
  remainingSeconds: number;
};

export function validateDurationMinutes(
  value: unknown
): { ok: true; value: number } | { ok: false; error: string } {
  const n =
    typeof value === "number"
      ? value
      : typeof value === "string"
        ? Number.parseInt(value.trim(), 10)
        : NaN;

  if (!Number.isFinite(n) || !Number.isInteger(n)) {
    return { ok: false, error: "مدة الاختبار يجب أن تكون عدداً صحيحاً بالدقائق." };
  }
  if (n < QUIZ_TIMER_MIN_MINUTES || n > QUIZ_TIMER_MAX_MINUTES) {
    return {
      ok: false,
      error: `مدة الاختبار يجب أن تكون بين ${QUIZ_TIMER_MIN_MINUTES} و ${QUIZ_TIMER_MAX_MINUTES} دقيقة.`,
    };
  }
  return { ok: true, value: n };
}

/** Minutes may exceed 59 (e.g. 125:05). Seconds always 00–59. */
export function formatRemainingMmSs(totalSeconds: number): string {
  const safe = Math.max(0, Math.floor(totalSeconds));
  const minutes = Math.floor(safe / 60);
  const seconds = safe % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

export function isWarningRemaining(seconds: number): boolean {
  return seconds > 0 && seconds <= QUIZ_TIMER_WARNING_SECONDS;
}

export function computeEndsAt(
  startedAt: string | Date,
  durationMinutes: number
): Date {
  const start =
    startedAt instanceof Date ? startedAt.getTime() : new Date(startedAt).getTime();
  return new Date(start + durationMinutes * 60_000);
}

export function computeRemainingSeconds(
  startedAt: string | Date,
  durationMinutes: number,
  now: Date = new Date()
): number {
  const ends = computeEndsAt(startedAt, durationMinutes);
  return Math.max(0, Math.floor((ends.getTime() - now.getTime()) / 1000));
}

export function toTimedQuizSessionView(
  startedAt: string,
  durationMinutes: number,
  now: Date = new Date()
): TimedQuizSessionView {
  const endsAt = computeEndsAt(startedAt, durationMinutes);
  return {
    startedAt,
    durationMinutes,
    endsAt: endsAt.toISOString(),
    remainingSeconds: computeRemainingSeconds(startedAt, durationMinutes, now),
  };
}

/** After deadline, answer mutations must be rejected; submit remains allowed. */
export function assertTimedSessionAllowsMutation(
  remainingSeconds: number
): { ok: true } | { ok: false; error: string } {
  if (remainingSeconds <= 0) {
    return {
      ok: false,
      error: "انتهى الوقت المحدد للاختبار. لا يمكن تعديل الإجابات.",
    };
  }
  return { ok: true };
}

export function parseTimerFormFields(formData: FormData): {
  is_timed: boolean;
  duration_minutes: number | null;
} {
  const rawTimed = formData.get("is_timed");
  const isTimed =
    rawTimed === "on" || rawTimed === "true" || rawTimed === "1";

  if (!isTimed) {
    return { is_timed: false, duration_minutes: null };
  }

  const validated = validateDurationMinutes(formData.get("duration_minutes"));
  if (!validated.ok) {
    throw new Error(validated.error);
  }
  return { is_timed: true, duration_minutes: validated.value };
}

/** Pad missing answers with empty strings (timed auto-submit / late reopen). */
export function padAnswersForQuestions(
  questionIds: string[],
  answers: Record<string, string>
): Record<string, string> {
  const out: Record<string, string> = {};
  for (const id of questionIds) {
    out[id] = answers[id] ?? "";
  }
  return out;
}

/** Client remaining seconds from absolute endsAt (refresh-safe). */
export function remainingSecondsFromEndsAt(
  endsAt: string,
  now: Date = new Date()
): number {
  const end = new Date(endsAt).getTime();
  if (!Number.isFinite(end)) return 0;
  return Math.max(0, Math.floor((end - now.getTime()) / 1000));
}
