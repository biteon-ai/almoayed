import { idbDelete, idbGet, idbPut, OFFLINE_STORES } from "@/lib/offline/db";
import type { InProgressRecord } from "@/lib/offline/types";

const debounceTimers = new Map<string, ReturnType<typeof setTimeout>>();

export async function saveInProgress(
  quizId: string,
  state: { answers: Record<string, string>; activeIndex?: number }
): Promise<void> {
  const record: InProgressRecord = {
    quizId,
    answers: state.answers,
    activeIndex: state.activeIndex,
    updatedAt: new Date().toISOString(),
  };
  await idbPut(OFFLINE_STORES.inProgress, record);
}

export function saveInProgressDebounced(
  quizId: string,
  state: { answers: Record<string, string>; activeIndex?: number },
  delayMs = 300
): void {
  const existing = debounceTimers.get(quizId);
  if (existing) clearTimeout(existing);

  debounceTimers.set(
    quizId,
    setTimeout(() => {
      debounceTimers.delete(quizId);
      void saveInProgress(quizId, state);
    }, delayMs)
  );
}

export async function getInProgress(
  quizId: string
): Promise<InProgressRecord | null> {
  const record = await idbGet<InProgressRecord>(
    OFFLINE_STORES.inProgress,
    quizId
  );
  return record ?? null;
}

export async function clearInProgress(quizId: string): Promise<void> {
  await idbDelete(OFFLINE_STORES.inProgress, quizId);
}
