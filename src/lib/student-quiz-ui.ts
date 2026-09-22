import type { QuizCarouselItem, RecentScoreRow } from "@/types/database";

export const QUIZ_CATEGORY_FILTERS = [
  "الكل",
  "رياضيات",
  "فيزياء",
  "كيمياء",
  "عام",
] as const;

export type QuizCategoryFilter = (typeof QUIZ_CATEGORY_FILTERS)[number];

/** Student /quizzes page — exam cards per pagination page (mobile-first). */
export const STUDENT_EXAMS_PAGE_SIZE = 4;

/** Student /results page — attempt result cards per pagination page (2×2 grid). */
export const STUDENT_RESULTS_PAGE_SIZE = 4;

export type QuizCardStatus = "locked" | "completed" | "in_progress" | "new";

export function estimateQuizDurationMinutes(questionCount: number): number {
  return Math.max(5, Math.round(questionCount * 2));
}

export function formatDurationAr(minutes: number): string {
  return `${minutes} دقيقة`;
}

export function getQuizCardStatus(
  quiz: QuizCarouselItem,
  isRecentlyCreated: boolean
): QuizCardStatus {
  if (quiz.isLocked) return "locked";
  if (quiz.hasSubmission && !quiz.canRetake) return "completed";
  if (quiz.hasSubmission && quiz.canRetake) return "in_progress";
  if (isRecentlyCreated) return "new";
  return "new";
}

/** Primary CTA on /quizzes cards — start or retake when attempts remain; review only when exhausted. */
export type QuizListActionKind = "start" | "retake" | "review";

export function getQuizListAction(
  quiz: Pick<QuizCarouselItem, "hasSubmission" | "canRetake">
): { kind: QuizListActionKind; label: string } {
  if (!quiz.hasSubmission) {
    return { kind: "start", label: "ابدأ الاختبار" };
  }
  if (quiz.canRetake) {
    return { kind: "retake", label: "إعادة المحاولة" };
  }
  return { kind: "review", label: "مراجعة النتيجة" };
}

export function isRecentlyCreatedQuiz(createdAt: string, days = 7): boolean {
  const created = new Date(createdAt).getTime();
  const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;
  return created >= cutoff;
}

export function matchesCategoryFilter(
  categoryName: string,
  filter: QuizCategoryFilter
): boolean {
  if (filter === "الكل") return true;
  if (filter === "عام") {
    return categoryName === "عام" || categoryName === "—";
  }
  return categoryName.includes(filter);
}

export function filterQuizzesByCategory<T extends { categoryName: string }>(
  quizzes: T[],
  filter: QuizCategoryFilter
): T[] {
  if (filter === "الكل") return quizzes;
  return quizzes.filter((quiz) => matchesCategoryFilter(quiz.categoryName, filter));
}

export function filterQuizzesBySearch<
  T extends { title?: string; quizTitle?: string },
>(items: T[], query: string): T[] {
  const normalized = query.trim().toLowerCase();
  if (!normalized) return items;
  return items.filter((item) => {
    const label = item.title ?? item.quizTitle ?? "";
    return label.toLowerCase().includes(normalized);
  });
}

export type ScoreGradeTone = "green" | "amber" | "red";

export function getScoreGrade(score: number): {
  label: string;
  emoji: string;
  tone: ScoreGradeTone;
} {
  if (score >= 80) {
    return { label: "ممتاز", emoji: "🌟", tone: "green" };
  }
  if (score >= 50) {
    return { label: "جيد جداً", emoji: "⚡", tone: "amber" };
  }
  return { label: "يحتاج مراجعة", emoji: "🎯", tone: "red" };
}

/** Compact circular/pill score badge — semantic color by band (UI-007). */
export function scoreBadgeClassName(tone: ScoreGradeTone): string {
  switch (tone) {
    case "green":
      return "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800/50 dark:bg-emerald-950/40 dark:text-emerald-200";
    case "amber":
      return "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-800/50 dark:bg-amber-950/40 dark:text-amber-200";
    case "red":
      return "border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-800/50 dark:bg-rose-950/40 dark:text-rose-200";
  }
}

/** Circumference leftover for an SVG score ring (0% = full offset, 100% = 0). */
export function scoreRingDashOffset(score: number, circumference: number): number {
  const clamped = Math.min(100, Math.max(0, score));
  return circumference * (1 - clamped / 100);
}

export function gradePillClassName(tone: ScoreGradeTone): string {
  switch (tone) {
    case "green":
      return "border-emerald-200/80 bg-emerald-500/10 text-emerald-700 dark:border-emerald-700/60 dark:bg-emerald-950/40 dark:text-emerald-300";
    case "amber":
      return "border-amber-200/80 bg-amber-500/10 text-amber-800 dark:border-amber-700/60 dark:bg-amber-950/40 dark:text-amber-300";
    case "red":
      return "border-rose-200/80 bg-rose-500/10 text-rose-700 dark:border-rose-700/60 dark:bg-rose-950/40 dark:text-rose-300";
  }
}

/** One quiz bucket: latest attempt + older attempts (newest first). */
export type QuizResultGroup = {
  quizId: string;
  quizTitle: string;
  categoryName: string;
  latest: RecentScoreRow;
  /** Past attempts only (excludes `latest`), already DESC by submittedAt. */
  archive: RecentScoreRow[];
};

/**
 * Collapse attempt rows into one group per quiz.
 * Input may be unsorted; output groups are ordered by latest attempt DESC.
 */
export function groupResultsByQuiz(scores: RecentScoreRow[]): QuizResultGroup[] {
  const sorted = [...scores].sort((a, b) =>
    b.submittedAt.localeCompare(a.submittedAt)
  );
  const byQuiz = new Map<string, RecentScoreRow[]>();

  for (const row of sorted) {
    const list = byQuiz.get(row.quizId);
    if (list) list.push(row);
    else byQuiz.set(row.quizId, [row]);
  }

  const groups: QuizResultGroup[] = [];
  for (const attempts of byQuiz.values()) {
    const [latest, ...archive] = attempts;
    if (!latest) continue;
    groups.push({
      quizId: latest.quizId,
      quizTitle: latest.quizTitle,
      categoryName: latest.categoryName,
      latest,
      archive,
    });
  }

  groups.sort((a, b) =>
    b.latest.submittedAt.localeCompare(a.latest.submittedAt)
  );
  return groups;
}
