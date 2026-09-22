/**
 * Quiz / review route warming — prefetch App Router payloads and the player chunk
 * on hover or when a quiz card enters the viewport (PERF-001).
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
  try {
    router.prefetch(href);
  } catch {
    // Prefetch is best-effort.
  }
  preloadQuizPlayerChunk();
}
