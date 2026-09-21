export type DashboardActionTileId =
  | "progress"
  | "quizzes"
  | "results"
  | "continue";

export function dashboardActionTileHref(
  id: DashboardActionTileId,
  continueQuizId: string | null
): string {
  switch (id) {
    case "progress":
      return "/dashboard#welcome";
    case "quizzes":
      return "/quizzes";
    case "results":
      return "/results";
    case "continue":
      return continueQuizId ? `/quiz/${continueQuizId}` : "/quizzes";
  }
}

export function dashboardActionTileHint(input: {
  id: DashboardActionTileId;
  streakDays: number;
  dailyGoalProgress: number;
  lastScore: number | null;
  continueTitle: string | null;
}): string {
  switch (input.id) {
    case "progress":
      return input.streakDays > 0
        ? `${input.streakDays} أيام متتالية · هدف اليوم ${input.dailyGoalProgress}%`
        : "ابدأ اختبار اليوم";
    case "quizzes":
      return "تصفح الاختبارات";
    case "results":
      return input.lastScore != null
        ? `آخر نتيجة ${input.lastScore}%`
        : "لا نتائج بعد";
    case "continue":
      return input.continueTitle
        ? input.continueTitle
        : "لا اختبار جارٍ — تصفح الاختبارات";
  }
}
