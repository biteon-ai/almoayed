import {
  idbDelete,
  idbGet,
  idbGetAll,
  idbPut,
  OFFLINE_STORES,
} from "@/lib/offline/db";
import type {
  PendingSubmissionRecord,
  PendingSubmissionStatus,
} from "@/lib/offline/types";
import { clearInProgress } from "@/lib/offline/in-progress";

function createId(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `pending-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export async function enqueuePendingSubmission(input: {
  quizId: string;
  teacherId: string;
  answers: Record<string, string>;
  questionIds: string[];
  sessionExpiredAtSubmit?: boolean;
}): Promise<PendingSubmissionRecord> {
  const record: PendingSubmissionRecord = {
    id: createId(),
    quizId: input.quizId,
    teacherId: input.teacherId,
    answers: input.answers,
    questionIds: input.questionIds,
    queuedAt: new Date().toISOString(),
    status: "queued",
    sessionExpiredAtSubmit: input.sessionExpiredAtSubmit,
  };

  await idbPut(OFFLINE_STORES.pendingSubmissions, record);
  await clearInProgress(input.quizId);
  return record;
}

export async function listPendingSubmissions(): Promise<PendingSubmissionRecord[]> {
  const all = await idbGetAll<PendingSubmissionRecord>(
    OFFLINE_STORES.pendingSubmissions
  );
  return all.filter((item) =>
    ["queued", "failed-retryable", "syncing"].includes(item.status)
  );
}

export async function countPendingSubmissions(): Promise<number> {
  const pending = await listPendingSubmissions();
  return pending.length;
}

export async function updatePendingStatus(
  id: string,
  status: PendingSubmissionStatus,
  lastError?: string
): Promise<void> {
  const record = await idbGet<PendingSubmissionRecord>(
    OFFLINE_STORES.pendingSubmissions,
    id
  );
  if (!record) return;

  await idbPut(OFFLINE_STORES.pendingSubmissions, {
    ...record,
    status,
    lastError,
  });
}

export async function removePendingSubmission(id: string): Promise<void> {
  await idbDelete(OFFLINE_STORES.pendingSubmissions, id);
}

export async function getPendingForQuiz(
  quizId: string
): Promise<PendingSubmissionRecord | null> {
  const all = await idbGetAll<PendingSubmissionRecord>(
    OFFLINE_STORES.pendingSubmissions
  );
  return (
    all.find(
      (item) =>
        item.quizId === quizId &&
        ["queued", "failed-retryable", "syncing"].includes(item.status)
    ) ?? null
  );
}
