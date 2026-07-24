import { describe, expect, it } from "vitest";
import {
  GAMIFICATION_TIER_SELECT,
  QUIZ_LIST_SELECT,
  SUBMISSION_LIST_SELECT,
} from "@/lib/perf-selects";
import { EXAM_QUESTION_SELECT_FIELDS } from "@/lib/quiz-gatekeeper";
import { mapTeacherDashboardRpcPayload } from "@/lib/teacher-analytics";
import { createQuiz } from "../helpers/quiz-factory";

describe("[PERF-001] lean select invariants", () => {
  it("quiz list select never requests wildcard or gatekeeper-forbidden answer fields", () => {
    expect(QUIZ_LIST_SELECT).not.toContain("*");
    expect(QUIZ_LIST_SELECT).not.toMatch(/correct_answer|explanation/);
    expect(SUBMISSION_LIST_SELECT).not.toContain("*");
    expect(GAMIFICATION_TIER_SELECT).not.toContain("*");
  });

  it("keeps QUIZ-001 exam select separate from list selects", () => {
    expect(EXAM_QUESTION_SELECT_FIELDS).toContain("id");
    expect(EXAM_QUESTION_SELECT_FIELDS).not.toContain("correct_answer");
  });
});

describe("[PERF-002] teacher dashboard RPC mapper", () => {
  const quiz = createQuiz({ id: "q1", title: "اختبار تجريبي", created_by: "t1" });

  it("maps RPC payload into TeacherDashboardAnalytics without cross-tenant fields", () => {
    const analytics = mapTeacherDashboardRpcPayload({
      studentLinks: [{ student_id: "s1", tier: "free" }],
      quizzes: [quiz],
      submissions: [
        {
          student_id: "s1",
          quiz_id: "q1",
          score: 90,
          submitted_at: "2026-07-20T10:00:00Z",
        },
      ],
      profiles: [{ id: "s1", full_name: "طالب تجريبي" }],
      groupMembers: [],
      studentCount: 1,
      quizCount: 1,
      pendingUpgrades: 0,
    });

    expect(analytics.studentCount).toBe(1);
    expect(analytics.quizCount).toBe(1);
    expect(analytics.kpis.completedAttempts).toBe(1);
    expect(analytics.kpis.topPerformer?.name).toBe("طالب تجريبي");
    expect(analytics.popularExams[0]?.title).toBe("اختبار تجريبي");
  });

  it("handles empty RPC arrays safely", () => {
    const analytics = mapTeacherDashboardRpcPayload({
      studentLinks: [],
      quizzes: [],
      submissions: [],
      profiles: [],
      groupMembers: [],
      studentCount: 0,
      quizCount: 0,
      pendingUpgrades: 0,
    });

    expect(analytics.kpis.completedAttempts).toBe(0);
    expect(analytics.popularExams).toEqual([]);
    expect(analytics.kpis.topPerformer).toBeNull();
  });
});
