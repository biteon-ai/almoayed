/** QUIZ-004 — countdown timer helpers (pure). */

export const QUIZ_TIMER_MIN_MINUTES = 1;
export const QUIZ_TIMER_MAX_MINUTES = 180;
export const QUIZ_TIMER_WARNING_SECONDS = 120;
/** Critical last minute — progress bar turns red even if % still > 20. */
export const QUIZ_TIMER_CRITICAL_SECONDS = 60;

export type TimerProgressTone = "green" | "amber" | "red";

export type TimedQuizSessionView = {
  startedAt: string;
  durationMinutes: number;
  /** Absolute server expiry ISO — source of truth across refresh. */
  endsAt: string;
  remainingSeconds: number;
  /** Server wall clock when this view was built (optional for offline cache). */
  serverNow?: string;
};

export type TimedSessionRow = {
  started_at: string;
  duration_minutes: number;
  ends_at?: string | null;
  used_attempts_at_start?: number | null;
};

/**
 * Decide whether an existing DB timed session still belongs to the open attempt.
 * Stale rows (wrong attempt stamp) must be replaced — never silently reused.
 */
export function shouldReuseTimedSession(
  existing: Pick<TimedSessionRow, "used_attempts_at_start"> | null | undefined,
  usedAttempts: number
): boolean {
  if (!existing) return false;
  const stamp =
    typeof existing.used_attempts_at_start === "number" &&
    Number.isFinite(existing.used_attempts_at_start)
      ? existing.used_attempts_at_start
      : 0;
  return stamp === usedAttempts;
}

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

export function resolveSessionEndsAt(
  row: Pick<TimedSessionRow, "started_at" | "duration_minutes" | "ends_at">
): Date {
  if (row.ends_at) {
    const parsed = new Date(row.ends_at);
    if (Number.isFinite(parsed.getTime())) return parsed;
  }
  return computeEndsAt(row.started_at, row.duration_minutes);
}

export function toTimedQuizSessionView(
  startedAt: string,
  durationMinutes: number,
  now: Date = new Date(),
  endsAt?: string | Date | null
): TimedQuizSessionView {
  const ends =
    endsAt instanceof Date
      ? endsAt
      : typeof endsAt === "string" && endsAt.trim()
        ? new Date(endsAt)
        : computeEndsAt(startedAt, durationMinutes);
  const endsMs = ends.getTime();
  const safeEnds = Number.isFinite(endsMs)
    ? ends
    : computeEndsAt(startedAt, durationMinutes);
  return {
    startedAt,
    durationMinutes,
    endsAt: safeEnds.toISOString(),
    remainingSeconds: Math.max(
      0,
      Math.floor((safeEnds.getTime() - now.getTime()) / 1000)
    ),
    serverNow: now.toISOString(),
  };
}

export function timedSessionViewFromRow(
  row: TimedSessionRow,
  now: Date = new Date()
): TimedQuizSessionView {
  return toTimedQuizSessionView(
    row.started_at,
    row.duration_minutes,
    now,
    resolveSessionEndsAt(row)
  );
}

/**
 * Countdown that ignores wall-clock changes after load.
 * Uses server remaining at hydration + monotonic `performance.now()` elapsed.
 */
export function remainingSecondsMonotonic(args: {
  serverRemainingSeconds: number;
  hydratedAtPerfMs: number;
  nowPerfMs: number;
}): number {
  const elapsedSec = Math.floor(
    (args.nowPerfMs - args.hydratedAtPerfMs) / 1000
  );
  return Math.max(0, Math.floor(args.serverRemainingSeconds) - elapsedSec);
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

/** Fill fraction for the taking countdown bar: remaining ÷ attempt duration. */
export function remainingTimeFraction(
  remainingSeconds: number,
  durationMinutes: number
): number {
  const total = durationMinutes * 60;
  if (!Number.isFinite(total) || total <= 0) return 0;
  if (!Number.isFinite(remainingSeconds)) return 0;
  return Math.min(1, Math.max(0, remainingSeconds / total));
}

/**
 * Progress-bar urgency from remaining % (and last 60s critical floor).
 * >50% green · 20–50% amber · <20% or ≤60s red.
 */
export function timerProgressTone(
  remainingSeconds: number,
  durationMinutes: number
): TimerProgressTone {
  if (!Number.isFinite(remainingSeconds) || remainingSeconds <= 0) {
    return "red";
  }
  if (remainingSeconds <= QUIZ_TIMER_CRITICAL_SECONDS) {
    return "red";
  }
  const fraction = remainingTimeFraction(remainingSeconds, durationMinutes);
  if (fraction < 0.2) return "red";
  if (fraction <= 0.5) return "amber";
  return "green";
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
