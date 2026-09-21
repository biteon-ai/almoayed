import { describe, expect, it } from "vitest";
import {
  dashboardActionTileHint,
  dashboardActionTileHref,
} from "@/lib/dashboard-action-tiles";

const FEATURE = "[DASH-002]";

describe(`${FEATURE} action tile mapping`, () => {
  it("maps tiles to existing student destinations", () => {
    expect(dashboardActionTileHref("progress", null)).toBe("/dashboard#welcome");
    expect(dashboardActionTileHref("quizzes", "q1")).toBe("/quizzes");
    expect(dashboardActionTileHref("results", null)).toBe("/results");
    expect(dashboardActionTileHref("continue", "quiz-9")).toBe("/quiz/quiz-9");
    expect(dashboardActionTileHref("continue", null)).toBe("/quizzes");
  });

  it("uses Arabic empty-state hints when there is no progress", () => {
    expect(
      dashboardActionTileHint({
        id: "progress",
        streakDays: 0,
        dailyGoalProgress: 0,
        lastScore: null,
        continueTitle: null,
      })
    ).toBe("ابدأ اختبار اليوم");
    expect(
      dashboardActionTileHint({
        id: "results",
        streakDays: 0,
        dailyGoalProgress: 0,
        lastScore: null,
        continueTitle: null,
      })
    ).toBe("لا نتائج بعد");
    expect(
      dashboardActionTileHint({
        id: "continue",
        streakDays: 0,
        dailyGoalProgress: 0,
        lastScore: null,
        continueTitle: null,
      })
    ).toBe("لا اختبار جارٍ — تصفح الاختبارات");
  });
});
