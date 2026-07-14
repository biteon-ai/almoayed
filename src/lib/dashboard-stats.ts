/** [DASH-001] Aggregate completed quiz scores for dashboard header stats. */
export function computeDashboardStats(scores: number[]): {
  completedQuizCount: number;
  overallAverageScore: number;
} {
  if (scores.length === 0) {
    return { completedQuizCount: 0, overallAverageScore: 0 };
  }

  const sum = scores.reduce((acc, score) => acc + score, 0);
  return {
    completedQuizCount: scores.length,
    overallAverageScore: Math.round(sum / scores.length),
  };
}

/** [DASH-001] Keep only submissions whose quiz belongs to the active teacher. */
export function filterScoresByTeacherQuizIds(
  submissions: Array<{ quiz_id: string; score: number }>,
  teacherQuizIds: Set<string>
): number[] {
  return submissions
    .filter((s) => teacherQuizIds.has(s.quiz_id))
    .map((s) => s.score);
}
