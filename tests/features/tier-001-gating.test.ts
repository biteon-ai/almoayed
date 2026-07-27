import { describe, expect, it } from "vitest";
import {
  computeQuizListItem,
  filterQuizzesVisibleToStudent,
  indexQuizGroupAssignments,
  isQuizGroupAccessible,
  isQuizVisibleToStudent,
} from "@/lib/quiz-access";
import {
  applyProApproval,
  canRequestProUpgrade,
} from "@/lib/tier-upgrade";
import { createQuiz } from "../helpers/quiz-factory";

const FEATURE_TIER = "[TIER-001]";
const FEATURE_UPGRADE = "[TIER-002]";

describe(`${FEATURE_TIER} Free vs Pro gating`, () => {
  it("free tier can access is_free quizzes only", () => {
    const freeQuiz = computeQuizListItem(createQuiz({ is_free: true }), {
      tier: "free",
      groupIds: [],
    });
    const proQuiz = computeQuizListItem(createQuiz({ is_free: false }), {
      tier: "free",
      groupIds: [],
    });

    expect(freeQuiz.isAccessible).toBe(true);
    expect(freeQuiz.isLocked).toBe(false);
    expect(proQuiz.isAccessible).toBe(false);
    expect(proQuiz.isLocked).toBe(true);
  });

  it("pro tier unlocks paid quizzes", () => {
    const item = computeQuizListItem(createQuiz({ is_free: false }), {
      tier: "pro",
      groupIds: [],
    });
    expect(item.isAccessible).toBe(true);
    expect(item.isLocked).toBe(false);
  });

  it("session_group quiz requires group membership", () => {
    const quiz = createQuiz({
      quiz_type: "session_group",
      target_group_id: "group-a",
      is_free: true,
    });

    const denied = computeQuizListItem(quiz, {
      tier: "pro",
      groupIds: ["group-b"],
    });
    expect(denied.isAccessible).toBe(false);
    expect(denied.isLocked).toBe(false);

    const allowed = computeQuizListItem(quiz, {
      tier: "pro",
      groupIds: ["group-a"],
    });
    expect(allowed.isAccessible).toBe(true);
  });

  it("session_group quiz allows any assigned group via junction list", () => {
    const quiz = createQuiz({
      quiz_type: "session_group",
      target_group_id: "group-a",
      is_free: true,
    });

    const allowed = computeQuizListItem(
      quiz,
      { tier: "pro", groupIds: ["group-b"] },
      ["group-a", "group-b"]
    );
    expect(allowed.isAccessible).toBe(true);
  });

  it("public quiz with no assigned groups is visible to all students", () => {
    const quiz = createQuiz({ quiz_type: "regular", is_free: true });

    expect(isQuizVisibleToStudent(quiz, [], [])).toBe(true);
    expect(isQuizVisibleToStudent(quiz, ["group-a"], [])).toBe(true);

    const item = computeQuizListItem(quiz, { tier: "pro", groupIds: [] }, []);
    expect(item.isAccessible).toBe(true);
  });

  it("group-assigned quiz is hidden from students outside assigned groups", () => {
    const quiz = createQuiz({ quiz_type: "regular", is_free: true });
    const assignments = indexQuizGroupAssignments([
      { quiz_id: quiz.id, group_id: "group-a" },
    ]);

    const visible = filterQuizzesVisibleToStudent(
      [quiz],
      ["group-b"],
      assignments
    );
    expect(visible).toHaveLength(0);

    const allowed = filterQuizzesVisibleToStudent(
      [quiz],
      ["group-a"],
      assignments
    );
    expect(allowed).toHaveLength(1);
  });

  it("group-assigned quiz visible when student belongs to any assigned group", () => {
    const quiz = createQuiz({ is_free: true });
    expect(
      isQuizGroupAccessible(quiz, ["group-b"], ["group-a", "group-b"])
    ).toBe(true);
  });
});

describe(`${FEATURE_UPGRADE} Pro upgrade request flow`, () => {
  it("allows upgrade request only for free tier without pending flag", () => {
    expect(canRequestProUpgrade({ tier: "free", upgrade_requested: false })).toBe(
      true
    );
    expect(canRequestProUpgrade({ tier: "free", upgrade_requested: true })).toBe(
      false
    );
    expect(canRequestProUpgrade({ tier: "pro", upgrade_requested: false })).toBe(
      false
    );
  });

  it("teacher approval clears upgrade_requested and sets pro tier", () => {
    expect(applyProApproval()).toEqual({
      tier: "pro",
      upgrade_requested: false,
    });
  });
});
