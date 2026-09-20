/** UI-016 — pure quiz-player helpers (pager, progress, exit guard). */

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
    label: `${answeredCount} من ${total}`,
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
