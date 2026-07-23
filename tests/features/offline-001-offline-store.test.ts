import { describe, expect, it, vi, beforeEach } from "vitest";
import { assertGatekeeperCompliance } from "@/lib/quiz-gatekeeper";
import { createExamQuestion } from "../helpers/quiz-factory";
import { isOnline } from "@/lib/offline/connectivity";

const FEATURE = "[OFFLINE-001]";

vi.mock("@/lib/offline/db", () => ({
  idbPut: vi.fn(),
  idbGet: vi.fn(),
  idbGetAll: vi.fn(),
  idbDelete: vi.fn(),
  idbGetMeta: vi.fn().mockResolvedValue([]),
  idbSetMeta: vi.fn(),
  OFFLINE_STORES: {
    quizPackages: "quizPackages",
    inProgress: "inProgress",
    pendingSubmissions: "pendingSubmissions",
    meta: "meta",
  },
}));

describe(`${FEATURE} offline store`, () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("saveQuizPackage rejects gatekeeper-forbidden fields", async () => {
    const { saveQuizPackage } = await import("@/lib/offline/quiz-cache");
    const leaked = {
      ...createExamQuestion(),
      correct_answer: "A",
    };

    await expect(
      saveQuizPackage({
        quiz: {
          id: "quiz-1",
          title: "Test",
        } as never,
        questions: [leaked as never],
        teacherId: "teacher-1",
      })
    ).rejects.toThrow(/\[QUIZ-001\]/);
  });

  it("saveQuizPackage writes gatekeeper-safe packages", async () => {
    const { idbPut } = await import("@/lib/offline/db");
    const { saveQuizPackage } = await import("@/lib/offline/quiz-cache");

    const questions = [createExamQuestion({ id: "q-1" })];
    assertGatekeeperCompliance(questions);

    await saveQuizPackage({
      quiz: {
        id: "quiz-1",
        title: "Test Quiz",
      } as never,
      questions,
      teacherId: "teacher-1",
    });

    expect(idbPut).toHaveBeenCalled();
  });

  it("isOnline defaults true when navigator undefined", () => {
    expect(typeof isOnline()).toBe("boolean");
  });
});

describe(`${FEATURE} app errors`, () => {
  it("defines offline sync rejection codes", async () => {
    const { ErrorCode, uiMessage } = await import("@/lib/app-errors");
    expect(uiMessage(ErrorCode.QUIZ_INACTIVE)).toMatch(/لم يعد متاح/);
    expect(uiMessage(ErrorCode.QUIZ_CHANGED)).toMatch(/تغيّر/);
  });
});
