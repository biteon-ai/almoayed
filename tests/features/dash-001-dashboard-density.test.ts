import { describe, expect, it } from "vitest";
import {
  computeDashboardStats,
  filterScoresByTeacherQuizIds,
} from "@/lib/dashboard-stats";

const FEATURE = "[DASH-001]";

describe(`${FEATURE} computeDashboardStats`, () => {
  it("returns zeros for empty scores", () => {
    expect(computeDashboardStats([])).toEqual({
      completedQuizCount: 0,
      overallAverageScore: 0,
    });
  });

  it("computes rounded mean of submission scores", () => {
    expect(computeDashboardStats([80, 90, 70])).toEqual({
      completedQuizCount: 3,
      overallAverageScore: 80,
    });
  });

  it("rounds average to nearest integer", () => {
    expect(computeDashboardStats([85, 86])).toEqual({
      completedQuizCount: 2,
      overallAverageScore: 86,
    });
  });
});

describe(`${FEATURE} filterScoresByTeacherQuizIds`, () => {
  it("keeps only scores for quizzes belonging to active teacher", () => {
    const teacherQuizIds = new Set(["q1", "q2"]);
    const submissions = [
      { quiz_id: "q1", score: 90 },
      { quiz_id: "q-other", score: 40 },
      { quiz_id: "q2", score: 70 },
    ];

    expect(
      filterScoresByTeacherQuizIds(submissions, teacherQuizIds)
    ).toEqual([90, 70]);
  });

  it("returns empty array when no matching quizzes", () => {
    expect(
      filterScoresByTeacherQuizIds(
        [{ quiz_id: "x", score: 50 }],
        new Set(["q1"])
      )
    ).toEqual([]);
  });
});
