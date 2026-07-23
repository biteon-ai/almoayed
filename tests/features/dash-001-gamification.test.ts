import { describe, expect, it } from "vitest";
import {
  buildStudentAchievements,
  computeDailyGoalProgress,
  computeScoreTrendPercent,
  computeStudentGamification,
  computeStudyStreak,
  countSubmissionsInLastDays,
} from "@/lib/student-gamification";
import type { QuizCarouselItem, RecentScoreRow } from "@/types/database";

const FEATURE = "[DASH-001]";

describe(`${FEATURE} computeStudyStreak`, () => {
  it("returns 0 when there are no submissions", () => {
    expect(computeStudyStreak([])).toBe(0);
  });

  it("counts consecutive days ending today", () => {
    const today = new Date().toISOString();
    const yesterday = new Date(Date.now() - 86_400_000).toISOString();

    expect(computeStudyStreak([today, yesterday])).toBe(2);
  });
});

describe(`${FEATURE} gamification aggregates`, () => {
  it("counts submissions in the last 7 days", () => {
    const recent = new Date().toISOString();
    const old = new Date(Date.now() - 10 * 86_400_000).toISOString();

    expect(countSubmissionsInLastDays([recent, old], 7)).toBe(1);
  });

  it("marks daily goal complete when a submission exists today", () => {
    expect(computeDailyGoalProgress([new Date().toISOString()])).toBe(100);
    expect(computeDailyGoalProgress([])).toBe(0);
  });

  it("computes score trend between recent and prior week", () => {
    const now = Date.now();
    const recentScores: RecentScoreRow[] = [
      {
        submissionId: "s1",
        quizId: "q1",
        quizTitle: "A",
        score: 90,
        submittedAt: new Date(now - 2 * 86_400_000).toISOString(),
        categoryName: "رياضيات",
      },
      {
        submissionId: "s2",
        quizId: "q2",
        quizTitle: "B",
        score: 80,
        submittedAt: new Date(now - 10 * 86_400_000).toISOString(),
        categoryName: "فيزياء",
      },
    ];

    expect(computeScoreTrendPercent(recentScores)).toBe(10);
  });

  it("builds earned achievements from streak and scores", () => {
    const achievements = buildStudentAchievements({
      streakDays: 5,
      recentScores: [
        {
          submissionId: "s1",
          quizId: "q1",
          quizTitle: "A",
          score: 90,
          submittedAt: new Date().toISOString(),
          categoryName: "رياضيات",
        },
      ],
      completedQuizCount: 10,
    });

    expect(achievements.find((a) => a.id === "study-flame")?.earned).toBe(true);
    expect(achievements.find((a) => a.id === "calculus-hero")?.earned).toBe(true);
    expect(achievements.find((a) => a.id === "exam-marathon")?.earned).toBe(true);
  });

  it("bundles continue quiz and progress from dashboard quizzes", () => {
    const quiz = (overrides: Partial<QuizCarouselItem> & Pick<QuizCarouselItem, "id">): QuizCarouselItem => ({
      title: "اختبار",
      created_by: "t1",
      category_id: null,
      topic_id: null,
      is_active: true,
      is_free: true,
      is_archived: false,
      quiz_type: "regular",
      target_group_id: null,
      created_at: "2026-01-01T00:00:00Z",
      updated_at: "2026-01-01T00:00:00Z",
      isAccessible: true,
      isLocked: false,
      questionCount: 10,
      hasSubmission: false,
      lastActivityAt: null,
      categoryName: "عام",
      lastScore: null,
      estimatedMinutes: 6,
      ...overrides,
    });

    const result = computeStudentGamification({
      quizzes: [
        quiz({
          id: "active",
          hasSubmission: true,
          lastActivityAt: "2026-06-10T10:00:00Z",
        }),
      ],
      recentScores: [],
      completedQuizCount: 1,
    });

    expect(result.continueQuiz?.id).toBe("active");
    expect(result.continueProgress).toBe(100);
  });
});
