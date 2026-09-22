/** UI-016 / UI-017 — pure quiz-player helpers (pager, progress, completeness, step nav). */

import { formatCountOf } from "@/lib/ui-chrome";

export type QuestionNavStatus =
  | "default"
  | "answered"
  | "active"
  | "correct"
  | "wrong"
  | "unanswered-review";

export const QUIZ_CHOICE_SELECTED = "#065f46";

export function optionLetter(index: number): string {
  return String.fromCharCode(65 + index);
}

export function answeredProgress(
  answeredCount: number,
  total: number
): { percent: number; label: string } {
  const percent =
    total <= 0
      ? 0
      : Math.min(100, Math.max(0, Math.round((100 * answeredCount) / total)));
  return {
    percent,
          label: formatCountOf(answeredCount, total),
  };
}

export function questionNavStatus(args: {
  index: number;
  activeIndex: number;
  questionId: string;
  isSubmitted: boolean;
  answers: Record<string, string>;
  results: { answers: Array<{ questionId: string; isCorrect: boolean }> } | null;
}): QuestionNavStatus {
  const { index, activeIndex, questionId, isSubmitted, answers, results } =
    args;

  if (index === activeIndex) return "active";

  if (isSubmitted && results) {
    const answer = results.answers.find((a) => a.questionId === questionId);
    if (!answer) return "unanswered-review";
    return answer.isCorrect ? "correct" : "wrong";
  }

  if (answers[questionId]) return "answered";
  return "default";
}

export function shouldConfirmQuizExit(args: {
  isSubmitted: boolean;
  pendingSync: boolean;
  questionCount: number;
  timeExpiredNotice: boolean;
}): boolean {
  return (
    !args.isSubmitted &&
    !args.pendingSync &&
    args.questionCount > 0 &&
    !args.timeExpiredNotice
  );
}

/**
 * Back-button destination for the quiz player.
 * Review (`?review=` or post-submit results) → نتائجي; active attempt → الاختبارات.
 */
export function quizPlayerExitHref(args: {
  isSubmitted: boolean;
  reviewSubmissionId?: string | null;
}): string {
  const isReviewMode =
    args.isSubmitted || Boolean(args.reviewSubmissionId?.trim());
  return isReviewMode ? "/results" : "/quizzes";
}

function hasAnswer(
  answers: Record<string, string>,
  questionId: string
): boolean {
  return String(answers[questionId] ?? "").trim() !== "";
}

/** UI-017 — every exam questionId has a non-empty answer (extra keys ignored). */
export function isQuizComplete(args: {
  answers: Record<string, string>;
  questionIds: string[];
}): boolean {
  if (args.questionIds.length === 0) return false;
  return args.questionIds.every((id) => hasAnswer(args.answers, id));
}

export function remainingUnanswered(args: {
  answers: Record<string, string>;
  questionIds: string[];
}): number {
  return args.questionIds.reduce(
    (count, id) => (hasAnswer(args.answers, id) ? count : count + 1),
    0
  );
}

/** First 0-based index without a non-empty answer; `0` when none remain. */
export function firstUnansweredIndex(args: {
  answers: Record<string, string>;
  questionIds: string[];
}): number {
  const index = args.questionIds.findIndex((id) => !hasAnswer(args.answers, id));
  return index < 0 ? 0 : index;
}

/** Pause after a choice so the selected green state is visible before auto-advance. */
export const QUIZ_AUTO_ADVANCE_MS = 300;

export function stepNavState(args: {
  activeIndex: number;
  questionCount: number;
}): { canPrev: boolean; canNext: boolean } {
  const { activeIndex, questionCount } = args;
  return {
    canPrev: questionCount > 0 && activeIndex > 0,
    canNext: questionCount > 0 && activeIndex < questionCount - 1,
  };
}

/** Three-slot window: previous, current (always middle), next. */
export function compactPagerWindow(
  activeIndex: number,
  count: number
): {
  prev: number | null;
  current: number;
  next: number | null;
  canPrev: boolean;
  canNext: boolean;
} {
  if (count <= 0) {
    return {
      prev: null,
      current: 0,
      next: null,
      canPrev: false,
      canNext: false,
    };
  }
  const current = Math.max(0, Math.min(activeIndex, count - 1));
  return {
    prev: current > 0 ? current - 1 : null,
    current,
    next: current < count - 1 ? current + 1 : null,
    canPrev: current > 0,
    canNext: current < count - 1,
  };
}

/**
 * Physical left→right slots for Arabic RTL chrome (matches «التالي» left / «السابق» right).
 * Example on Q7: left = 8, current = 7, right = 6.
 */
export function rtlCompactPagerSlots(
  activeIndex: number,
  count: number
): {
  left: number | null;
  current: number;
  right: number | null;
  canGoLeft: boolean;
  canGoRight: boolean;
} {
  const slots = compactPagerWindow(activeIndex, count);
  return {
    left: slots.next,
    current: slots.current,
    right: slots.prev,
    canGoLeft: slots.canNext,
    canGoRight: slots.canPrev,
  };
}

/** [QUIZ-006] True when a device draft belongs to a previous attempt (or has no stamp). */
export function isStaleInProgressDraft(args: {
  usedAttempts: number;
  draftUsedAttemptsAtStart: number | undefined;
  hasPendingSubmission: boolean;
}): boolean {
  if (args.hasPendingSubmission) return false;
  if (
    typeof args.draftUsedAttemptsAtStart !== "number" ||
    !Number.isFinite(args.draftUsedAttemptsAtStart)
  ) {
    return true;
  }
  return args.draftUsedAttemptsAtStart !== args.usedAttempts;
}
