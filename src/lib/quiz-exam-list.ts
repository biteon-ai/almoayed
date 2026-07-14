import type { QuizCarouselItem } from "@/types/database";

/** @deprecated Use responsive helpers below — kept for backward-compatible tests */
export const QUIZ_QUEUE_PAGE_SIZE = 6;

/** Tailwind `md` breakpoint — below this is treated as mobile */
export const QUIZ_QUEUE_MOBILE_MAX_WIDTH_PX = 767;

/** Initial visible cards: 3 on mobile, 8 on desktop */
export const QUIZ_QUEUE_INITIAL_MOBILE = 3;
export const QUIZ_QUEUE_INITIAL_DESKTOP = 8;

export function getQuizQueueInitialCount(isMobile: boolean): number {
  return isMobile ? QUIZ_QUEUE_INITIAL_MOBILE : QUIZ_QUEUE_INITIAL_DESKTOP;
}

export function getQuizQueueLoadMoreStep(isMobile: boolean): number {
  return getQuizQueueInitialCount(isMobile);
}

/** When searching, show every match; otherwise paginate with visibleCount. */
export function sliceVisibleQueue(
  filteredQueue: QuizCarouselItem[],
  visibleCount: number,
  isSearching: boolean
): QuizCarouselItem[] {
  if (isSearching) return filteredQueue;
  return filteredQueue.slice(0, visibleCount);
}

export function shouldShowQuizQueueLoadMore(
  filteredQueue: QuizCarouselItem[],
  visibleCount: number,
  isSearching: boolean
): boolean {
  if (isSearching) return false;
  return visibleCount < filteredQueue.length;
}

export function remainingQuizQueueCount(
  filteredQueue: QuizCarouselItem[],
  visibleCount: number
): number {
  return Math.max(0, filteredQueue.length - visibleCount);
}

export type QuizExamSections = {
  continueQuiz: QuizCarouselItem | null;
  queueQuizzes: QuizCarouselItem[];
};

/** Most recent in-progress exam (has submission) for the continue section. */
export function pickContinueQuiz(
  quizzes: QuizCarouselItem[]
): QuizCarouselItem | null {
  const candidates = quizzes
    .filter((quiz) => quiz.hasSubmission && !quiz.isLocked)
    .sort((a, b) => {
      const aTime = a.lastActivityAt
        ? new Date(a.lastActivityAt).getTime()
        : 0;
      const bTime = b.lastActivityAt
        ? new Date(b.lastActivityAt).getTime()
        : 0;
      return bTime - aTime;
    });

  return candidates[0] ?? null;
}

export function splitQuizExamSections(
  quizzes: QuizCarouselItem[]
): QuizExamSections {
  const continueQuiz = pickContinueQuiz(quizzes);
  const queueQuizzes = continueQuiz
    ? quizzes.filter((quiz) => quiz.id !== continueQuiz.id)
    : [...quizzes];

  return { continueQuiz, queueQuizzes };
}

export function filterQuizzesByQuery(
  quizzes: QuizCarouselItem[],
  query: string
): QuizCarouselItem[] {
  const normalized = query.trim().toLowerCase();
  if (!normalized) return quizzes;

  return quizzes.filter((quiz) =>
    quiz.title.toLowerCase().includes(normalized)
  );
}
