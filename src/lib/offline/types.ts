import type { ExamQuestion, Quiz } from "@/types/database";

export type PendingSubmissionStatus =
  | "queued"
  | "syncing"
  | "synced"
  | "rejected"
  | "failed-retryable";

export type QuizPackageRecord = {
  quizId: string;
  teacherId: string;
  quiz: Quiz;
  questions: ExamQuestion[];
  questionIds: string[];
  cachedAt: string;
  openedAt: string;
  /** QUIZ-004 — snapshot for offline countdown (endsAt absolute) */
  timer?: {
    startedAt: string;
    durationMinutes: number;
    endsAt: string;
    remainingSeconds: number;
  } | null;
};

export type InProgressRecord = {
  quizId: string;
  answers: Record<string, string>;
  activeIndex?: number;
  /** [QUIZ-006] Attempt count when this draft started; mismatch means stale retake leak. */
  usedAttemptsAtStart?: number;
  updatedAt: string;
};

export type PendingSubmissionRecord = {
  id: string;
  quizId: string;
  teacherId: string;
  answers: Record<string, string>;
  questionIds: string[];
  queuedAt: string;
  status: PendingSubmissionStatus;
  lastError?: string;
  sessionExpiredAtSubmit?: boolean;
};
