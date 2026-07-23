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
};

export type InProgressRecord = {
  quizId: string;
  answers: Record<string, string>;
  activeIndex?: number;
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
