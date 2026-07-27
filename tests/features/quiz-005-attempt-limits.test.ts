import { describe, expect, it } from "vitest";
import {
  buildAttemptState,
  canStartNewAttempt,
  categoryDefaultMaxAttempts,
  rankChallengeLeaderboard,
  validateMaxAttempts,
} from "@/lib/quiz-attempts";
import { aggregateSubmissionStats } from "@/lib/teacher-gamification";

describe("QUIZ-005 quiz attempt helpers", () => {
  it("validateMaxAttempts accepts unlimited and 1–10", () => {
    expect(validateMaxAttempts({ unlimited: true, value: 0 }).ok).toBe(true);
    expect(validateMaxAttempts({ unlimited: false, value: 3 }).ok).toBe(true);
    expect(validateMaxAttempts({ unlimited: false, value: 11 }).ok).toBe(false);
  });

  it("categoryDefaultMaxAttempts maps practice/evaluation/challenge", () => {
    expect(categoryDefaultMaxAttempts("practice")).toBe(0);
    expect(categoryDefaultMaxAttempts("evaluation")).toBe(1);
    expect(categoryDefaultMaxAttempts("challenge")).toBe(1);
  });

  it("canStartNewAttempt respects finite and unlimited caps", () => {
    expect(canStartNewAttempt(0, 1)).toBe(true);
    expect(canStartNewAttempt(1, 1)).toBe(false);
    expect(canStartNewAttempt(5, 0)).toBe(true);
    expect(canStartNewAttempt(2, 3)).toBe(true);
    expect(canStartNewAttempt(3, 3)).toBe(false);
  });

  it("buildAttemptState marks review when exhausted", () => {
    const state = buildAttemptState(1, [
      { id: "s1", score: 80, submitted_at: "2026-01-01T00:00:00Z" },
    ]);
    expect(state.canStartNewAttempt).toBe(false);
    expect(state.reviewSubmissionId).toBe("s1");
    expect(state.bestScore).toBe(80);
  });

  it("buildAttemptState allows retake when under cap", () => {
    const state = buildAttemptState(3, [
      { id: "s1", score: 60, submitted_at: "2026-01-01T00:00:00Z" },
    ]);
    expect(state.canStartNewAttempt).toBe(true);
    expect(state.reviewSubmissionId).toBeNull();
  });

  it("rankChallengeLeaderboard uses best score and submit time", () => {
    const ranked = rankChallengeLeaderboard([
      {
        studentId: "a",
        displayName: "A",
        score: 70,
        submittedAt: "2026-01-02T00:00:00Z",
      },
      {
        studentId: "a",
        displayName: "A",
        score: 90,
        submittedAt: "2026-01-03T00:00:00Z",
      },
      {
        studentId: "b",
        displayName: "B",
        score: 85,
        submittedAt: "2026-01-01T00:00:00Z",
      },
    ]);
    expect(ranked[0]?.studentId).toBe("a");
    expect(ranked[0]?.score).toBe(90);
    expect(ranked[1]?.studentId).toBe("b");
  });

  it("aggregateSubmissionStats counts unique quizzes with best score", () => {
    const stats = aggregateSubmissionStats([
      { quizId: "q1", score: 60 },
      { quizId: "q1", score: 90 },
      { quizId: "q2", score: 50 },
    ]);
    expect(stats.totalQuizzesCompleted).toBe(2);
    expect(stats.averageScorePercentage).toBe(70);
  });
});
