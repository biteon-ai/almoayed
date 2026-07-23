import { assertGatekeeperCompliance } from "@/lib/quiz-gatekeeper";
import type { ExamQuestion, Quiz } from "@/types/database";
import {
  idbDelete,
  idbGet,
  idbGetAll,
  idbGetMeta,
  idbPut,
  idbSetMeta,
  OFFLINE_STORES,
} from "@/lib/offline/db";
import type { QuizPackageRecord } from "@/lib/offline/types";

const MAX_PACKAGES = 20;
const LRU_META_KEY = "quizPackageLru";

async function touchLru(quizId: string): Promise<void> {
  const lru = (await idbGetMeta<string[]>(LRU_META_KEY)) ?? [];
  const next = [quizId, ...lru.filter((id) => id !== quizId)];
  await idbSetMeta(LRU_META_KEY, next);
}

async function enforceLruCap(): Promise<void> {
  const lru = (await idbGetMeta<string[]>(LRU_META_KEY)) ?? [];
  if (lru.length <= MAX_PACKAGES) return;

  const pending = await idbGetAll<{ quizId: string }>(OFFLINE_STORES.pendingSubmissions);
  const inProgress = await idbGetAll<{ quizId: string }>(OFFLINE_STORES.inProgress);
  const protectedIds = new Set([
    ...pending.map((p) => p.quizId),
    ...inProgress.map((p) => p.quizId),
  ]);

  const toEvict = [...lru].reverse().filter((id) => !protectedIds.has(id));
  while (lru.length > MAX_PACKAGES && toEvict.length > 0) {
    const evictId = toEvict.pop();
    if (!evictId) break;
    await idbDelete(OFFLINE_STORES.quizPackages, evictId);
    const idx = lru.indexOf(evictId);
    if (idx >= 0) lru.splice(idx, 1);
  }

  await idbSetMeta(LRU_META_KEY, lru);
}

export async function saveQuizPackage(input: {
  quiz: Quiz;
  questions: ExamQuestion[];
  teacherId: string;
}): Promise<void> {
  assertGatekeeperCompliance(input.questions);

  const now = new Date().toISOString();
  const record: QuizPackageRecord = {
    quizId: input.quiz.id,
    teacherId: input.teacherId,
    quiz: input.quiz,
    questions: input.questions,
    questionIds: input.questions.map((q) => q.id),
    cachedAt: now,
    openedAt: now,
  };

  await idbPut(OFFLINE_STORES.quizPackages, record);
  await touchLru(input.quiz.id);
  await enforceLruCap();
}

export async function getQuizPackage(
  quizId: string
): Promise<QuizPackageRecord | null> {
  const record = await idbGet<QuizPackageRecord>(
    OFFLINE_STORES.quizPackages,
    quizId
  );
  return record ?? null;
}

export async function hasQuizPackage(quizId: string): Promise<boolean> {
  return (await getQuizPackage(quizId)) !== null;
}
