import type { CategoryPerformance } from "@/types/database";

export interface AnswerStatRow {
  is_correct: boolean;
  category_tag: string;
}

/** [QUIZ-002] Aggregate per-category success rates from submitted answers. */
export function aggregateCategoryPerformance(
  rows: AnswerStatRow[]
): CategoryPerformance[] {
  if (!rows.length) return [];

  const stats = new Map<string, { total: number; correct: number }>();

  for (const row of rows) {
    const tag = row.category_tag.trim() || "عام";
    const current = stats.get(tag) ?? { total: 0, correct: 0 };
    current.total += 1;
    if (row.is_correct) current.correct += 1;
    stats.set(tag, current);
  }

  return Array.from(stats.entries())
    .map(([category_tag, { total, correct }]) => ({
      category_tag,
      total_attempted: total,
      correct_count: correct,
      success_percentage: Math.round((correct / total) * 1000) / 10,
    }))
    .sort((a, b) => a.success_percentage - b.success_percentage);
}
