import type { QuizCarouselItem } from "@/types/database";

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
  if (quiz.hasSubmission) return "completed";
  if (isRecentlyCreated) return "new";
  return "new";
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
  if (score >= 60) {
    return { label: "جيد جداً", emoji: "⚡", tone: "amber" };
  }
  return { label: "يحتاج مراجعة", emoji: "🎯", tone: "red" };
}

export function scoreBadgeClassName(tone: ScoreGradeTone): string {
  switch (tone) {
    case "green":
      return "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/50 dark:bg-emerald-950/40 dark:text-emerald-300";
    case "amber":
      return "border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-900/50 dark:bg-amber-950/40 dark:text-amber-300";
    case "red":
      return "border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-900/50 dark:bg-rose-950/40 dark:text-rose-300";
  }
}

export function gradePillClassName(tone: ScoreGradeTone): string {
  switch (tone) {
    case "green":
      return "border-emerald-200/80 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300";
    case "amber":
      return "border-amber-200/80 bg-amber-500/10 text-amber-800 dark:text-amber-300";
    case "red":
      return "border-rose-200/80 bg-rose-500/10 text-rose-700 dark:text-rose-300";
  }
}
