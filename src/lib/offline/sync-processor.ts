"use client";

import { submitQuiz } from "@/actions/quiz";
import { AppError, ErrorCode, uiMessage } from "@/lib/app-errors";
import { isOnline } from "@/lib/offline/connectivity";
import {
  listPendingSubmissions,
  removePendingSubmission,
  updatePendingStatus,
} from "@/lib/offline/pending-queue";

export type FlushResult = {
  synced: number;
  rejected: number;
  failed: number;
};

let flushInFlight: Promise<FlushResult> | null = null;

export async function flushPendingSubmissions(): Promise<FlushResult> {
  if (!isOnline()) {
    return { synced: 0, rejected: 0, failed: 0 };
  }

  if (flushInFlight) {
    return flushInFlight;
  }

  flushInFlight = flushPendingSubmissionsInternal().finally(() => {
    flushInFlight = null;
  });

  return flushInFlight;
}

async function flushPendingSubmissionsInternal(): Promise<FlushResult> {
  const result: FlushResult = { synced: 0, rejected: 0, failed: 0 };
  const pending = await listPendingSubmissions();

  for (const item of pending.sort(
    (a, b) => a.queuedAt.localeCompare(b.queuedAt)
  )) {
    await updatePendingStatus(item.id, "syncing");

    try {
      const answers =
        item.sessionExpiredAtSubmit
          ? Object.fromEntries(
              item.questionIds.map((id) => [id, item.answers[id] ?? ""])
            )
          : item.answers;
      await submitQuiz(item.quizId, answers);
      await removePendingSubmission(item.id);
      result.synced += 1;
    } catch (error) {
      if (error instanceof AppError) {
        if (
          error.code === ErrorCode.QUIZ_INACTIVE ||
          error.code === ErrorCode.QUIZ_CHANGED ||
          error.code === ErrorCode.QUIZ_ATTEMPTS_EXHAUSTED
        ) {
          await updatePendingStatus(item.id, "rejected", error.userMessage);
          result.rejected += 1;
          continue;
        }

        if (error.code === ErrorCode.SUBSCRIPTION_REQUIRED) {
          await updatePendingStatus(
            item.id,
            "failed-retryable",
            error.userMessage
          );
          result.failed += 1;
          break;
        }
      }

      await updatePendingStatus(
        item.id,
        "failed-retryable",
        uiMessage(ErrorCode.NETWORK_ERROR)
      );
      result.failed += 1;
    }
  }

  if (typeof window !== "undefined") {
    window.dispatchEvent(
      new CustomEvent("offline-sync-complete", { detail: result })
    );
  }

  return result;
}
