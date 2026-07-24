import { describe, expect, it } from "vitest";
import {
  isTeacherDashboardKpiPayload,
  mapTeacherDashboardKpiPayload,
} from "@/lib/teacher-analytics";

describe("[PERF-004] dashboard KPI payload contracts", () => {
  it("rejects legacy row-dump payloads with studentLinks/submissions arrays", () => {
    expect(
      isTeacherDashboardKpiPayload({
        studentLinks: [{ student_id: "s1", tier: "free" }],
        submissions: [],
        studentCount: 1,
      })
    ).toBe(false);
  });

  it("accepts aggregate KPI shape and caps popularExams at 10", () => {
    const popularExams = Array.from({ length: 12 }, (_, i) => ({
      rank: i + 1,
      title: `اختبار ${i + 1}`,
      attempts: 10 - (i % 10),
      completionRate: 50,
    }));

    const payload = {
      studentCount: 5,
      quizCount: 3,
      pendingUpgrades: 1,
      submissionCount: 8,
      averageScore: 77,
      passRate: 80,
      perfectScoreStudentCount: 1,
      completionRate: 40,
      gradeDistribution: [
        { range: "0-49%", label: "راسب", count: 0 },
        { range: "90-100%", label: "ممتاز", count: 2 },
      ],
      weeklyActivity: [{ day: "الأحد", passed: 1, failed: 0 }],
      popularExams,
      topPerformer: null,
      examDifficulty: { hardest: null, easiest: null },
    };

    expect(isTeacherDashboardKpiPayload(payload)).toBe(true);
    const analytics = mapTeacherDashboardKpiPayload(payload);
    expect(analytics.popularExams).toHaveLength(10);
    expect(JSON.stringify(analytics)).not.toMatch(/correct_answer|explanation/);
    expect(analytics).not.toHaveProperty("studentLinks");
    expect(analytics).not.toHaveProperty("submissions");
    expect(analytics.studentCount).toBe(5);
    expect(analytics.kpis.averageScore).toBe(77);
  });

  it("maps empty KPI payload safely", () => {
    const analytics = mapTeacherDashboardKpiPayload({
      studentCount: 0,
      quizCount: 0,
      pendingUpgrades: 0,
      popularExams: [],
      gradeDistribution: [],
      weeklyActivity: [],
    });
    expect(analytics.kpis.completedAttempts).toBe(0);
    expect(analytics.popularExams).toEqual([]);
    expect(analytics.kpis.topPerformer).toBeNull();
  });
});
