/**
 * Quiz / review route warming — prefetch App Router payloads and the player chunk
 * on hover or when a quiz card enters the viewport (PERF-001).
 *
 * Taking routes (`/quiz/:id` without `review=`) must NOT RSC-prefetch: the page
 * calls `ensureTimedQuizSession` (QUIZ-004), and a prefetch would start the clock
 * before the student opens the quiz.
 */

export function quizPlayerHref(
  quizId: string,
  opts?: { reviewSubmissionId?: string | null }
): string {
  const review = opts?.reviewSubmissionId?.trim();
  if (review) {
    return `/quiz/${quizId}?review=${encodeURIComponent(review)}`;
  }
  return `/quiz/${quizId}`;
}

/** True for `/quiz/:id` taking URLs (no review query). */
export function isQuizTakingHref(href: string): boolean {
  try {
    const url = new URL(href, "https://almoayed.local");
    if (!url.pathname.startsWith("/quiz/")) return false;
    return !url.searchParams.get("review")?.trim();
  } catch {
    return false;
  }
}

/** Warm the QuizRunner client bundle before navigation. */
export function preloadQuizPlayerChunk(): void {
  if (typeof window === "undefined") return;
  void import("@/components/quiz/QuizRunner");
}

type PrefetchRouter = {
  prefetch: (href: string) => void;
};

export function prefetchQuizRoute(
  router: PrefetchRouter,
  href: string
): void {
  // Taking: warm JS only — RSC prefetch would mint a timed session early.
  if (!isQuizTakingHref(href)) {
    try {
      router.prefetch(href);
    } catch {
      // Prefetch is best-effort.
    }
  }
  preloadQuizPlayerChunk();
}
