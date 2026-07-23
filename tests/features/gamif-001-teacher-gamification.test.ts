import { describe, expect, it } from "vitest";
import {
  DEFAULT_GAMIFICATION_TIERS,
  getDefaultGamificationTierPayload,
} from "@/lib/gamification-presets";
import {
  aggregateSubmissionStats,
  computeTeacherGamificationStatus,
  GAMIFICATION_MAX_TIERS,
  resolveGamificationIconParts,
  toLadderInputs,
  validateGamificationLadder,
} from "@/lib/teacher-gamification";
import type { GamificationTier } from "@/types/database";

const FEATURE = "[GAMIF-001]";
const FEATURE_PRESETS = "[GAMIF-002]";

function tier(
  overrides: Partial<GamificationTier> & {
    level_number: number;
    level_name: string;
  }
): GamificationTier {
  return {
    id: overrides.id ?? `tier-${overrides.level_number}`,
    teacher_id: "teacher-a",
    level_number: overrides.level_number,
    level_name: overrides.level_name,
    min_completed_quizzes: overrides.min_completed_quizzes ?? 0,
    min_avg_score: overrides.min_avg_score ?? 0,
    icon_type: overrides.icon_type ?? "badge",
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
  };
}

describe(`${FEATURE} validateGamificationLadder`, () => {
  it("accepts a non-decreasing effort ladder", () => {
    const result = validateGamificationLadder([
      {
        levelName: "مبتدئ",
        minCompletedQuizzes: 0,
        minAvgScore: 0,
        iconType: "badge",
      },
      {
        levelName: "مكافح",
        minCompletedQuizzes: 2,
        minAvgScore: 50,
        iconType: "cup",
      },
      {
        levelName: "أسطورة",
        minCompletedQuizzes: 5,
        minAvgScore: 80,
        iconType: "diamond",
      },
    ]);
    expect(result).toEqual({ ok: true });
  });

  it("rejects inverted effort (higher level easier)", () => {
    const result = validateGamificationLadder([
      {
        levelName: "أ",
        minCompletedQuizzes: 5,
        minAvgScore: 80,
        iconType: "cup",
      },
      {
        levelName: "ب",
        minCompletedQuizzes: 2,
        minAvgScore: 50,
        iconType: "star",
      },
    ]);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toContain("أسهل");
    }
  });

  it("rejects more than 20 tiers", () => {
    const tiers = Array.from({ length: GAMIFICATION_MAX_TIERS + 1 }, (_, i) => ({
      levelName: `مستوى ${i + 1}`,
      minCompletedQuizzes: i,
      minAvgScore: Math.min(100, i * 5),
      iconType: "star" as const,
    }));
    const result = validateGamificationLadder(tiers);
    expect(result).toEqual({ ok: false, error: "الحد الأقصى 20 مستوى" });
  });

  it("rejects empty level names", () => {
    const result = validateGamificationLadder([
      {
        levelName: "   ",
        minCompletedQuizzes: 0,
        minAvgScore: 0,
        iconType: "badge",
      },
    ]);
    expect(result.ok).toBe(false);
  });
});

describe(`${FEATURE} aggregateSubmissionStats`, () => {
  it("counts unique quizzes and uses best score per quiz", () => {
    const stats = aggregateSubmissionStats([
      { quizId: "q1", score: 40 },
      { quizId: "q1", score: 90 },
      { quizId: "q2", score: 70 },
    ]);
    expect(stats.totalQuizzesCompleted).toBe(2);
    expect(stats.averageScorePercentage).toBe(80);
  });

  it("returns zero average with no submissions", () => {
    expect(aggregateSubmissionStats([])).toEqual({
      totalQuizzesCompleted: 0,
      averageScorePercentage: 0,
    });
  });
});

describe(`${FEATURE} computeTeacherGamificationStatus`, () => {
  const ladder = [
    tier({
      level_number: 1,
      level_name: "مبتدئ",
      min_completed_quizzes: 0,
      min_avg_score: 0,
      icon_type: "badge",
    }),
    tier({
      level_number: 2,
      level_name: "مكافح",
      min_completed_quizzes: 2,
      min_avg_score: 50,
      icon_type: "cup",
    }),
    tier({
      level_number: 3,
      level_name: "أسطورة",
      min_completed_quizzes: 5,
      min_avg_score: 80,
      icon_type: "diamond",
    }),
  ];

  it("returns null when there are no tiers", () => {
    expect(
      computeTeacherGamificationStatus({ tiers: [], submissions: [] })
    ).toBeNull();
  });

  it("picks current and next tier with bottleneck progress", () => {
    const status = computeTeacherGamificationStatus({
      tiers: ladder,
      submissions: [
        { quizId: "q1", score: 60 },
        { quizId: "q2", score: 70 },
      ],
    });
    expect(status).not.toBeNull();
    expect(status!.currentTier?.levelName).toBe("مكافح");
    expect(status!.nextTier?.levelName).toBe("أسطورة");
    expect(status!.remainingQuizzes).toBe(3);
    expect(status!.remainingScorePoints).toBe(15);
    // quiz progress 2/5=0.4, score 65/80=0.8125 → bottleneck 0.4
    expect(status!.progressFill).toBeCloseTo(0.4);
    expect(status!.badges.filter((b) => b.unlocked).map((b) => b.levelName)).toEqual(
      ["مبتدئ", "مكافح"]
    );
  });

  it("shows top-tier state with full progress when highest met", () => {
    const status = computeTeacherGamificationStatus({
      tiers: ladder,
      submissions: [
        { quizId: "a", score: 90 },
        { quizId: "b", score: 85 },
        { quizId: "c", score: 80 },
        { quizId: "d", score: 88 },
        { quizId: "e", score: 92 },
      ],
    });
    expect(status!.currentTier?.levelName).toBe("أسطورة");
    expect(status!.nextTier).toBeNull();
    expect(status!.progressFill).toBe(1);
    expect(status!.badges.every((b) => b.unlocked)).toBe(true);
  });

  it("isolates compute inputs per teacher tier set", () => {
    const teacherB = [
      tier({
        id: "b1",
        teacher_id: "teacher-b",
        level_number: 1,
        level_name: "نجم",
        min_completed_quizzes: 1,
        min_avg_score: 90,
        icon_type: "star",
      }),
    ];
    const submissions = [{ quizId: "q1", score: 100 }];
    const statusA = computeTeacherGamificationStatus({
      tiers: ladder,
      submissions,
    });
    const statusB = computeTeacherGamificationStatus({
      tiers: teacherB,
      submissions,
    });
    expect(statusA!.currentTier?.levelName).toBe("مبتدئ");
    expect(statusB!.currentTier?.levelName).toBe("نجم");
    expect(statusB!.badges).toHaveLength(1);
  });
});

describe(`${FEATURE_PRESETS} default ladder`, () => {
  it("has 11 tiers under the max and passes effort validation", () => {
    expect(DEFAULT_GAMIFICATION_TIERS).toHaveLength(11);
    expect(DEFAULT_GAMIFICATION_TIERS.length).toBeLessThanOrEqual(
      GAMIFICATION_MAX_TIERS
    );
    const payload = getDefaultGamificationTierPayload();
    expect(validateGamificationLadder(toLadderInputs(payload))).toEqual({
      ok: true,
    });
  });

  it("keeps non-decreasing quizzes and averages across the ladder", () => {
    for (let i = 1; i < DEFAULT_GAMIFICATION_TIERS.length; i++) {
      const prev = DEFAULT_GAMIFICATION_TIERS[i - 1];
      const curr = DEFAULT_GAMIFICATION_TIERS[i];
      expect(curr.min_completed_quizzes).toBeGreaterThanOrEqual(
        prev.min_completed_quizzes
      );
      expect(curr.min_avg_score).toBeGreaterThanOrEqual(prev.min_avg_score);
    }
  });

  it("ends with crown legend tier", () => {
    const last = DEFAULT_GAMIFICATION_TIERS.at(-1);
    expect(last?.icon_type).toBe("crown");
    expect(last?.level_name).toBe("الأسطورة الخالدة");
  });
});

describe("[GAMIF-003] resolveGamificationIconParts", () => {
  it("splits stacked cup metals into main trophy + corner medal", () => {
    expect(resolveGamificationIconParts("cup_bronze")).toEqual({
      mainIcon: "🏆",
      subBadgeIcon: "🥉",
    });
    expect(resolveGamificationIconParts("cup_silver")).toEqual({
      mainIcon: "🏆",
      subBadgeIcon: "🥈",
    });
  });

  it("keeps single icons without a corner badge", () => {
    expect(resolveGamificationIconParts("diamond")).toEqual({
      mainIcon: "💎",
      subBadgeIcon: null,
    });
  });
});
