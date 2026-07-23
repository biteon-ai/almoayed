import { describe, expect, it } from "vitest";
import {
  computeDashboardStats,
  filterScoresByTeacherQuizIds,
} from "@/lib/dashboard-stats";
import {
  filterQuizzesByQuery,
  getQuizQueueInitialCount,
  getQuizQueueLoadMoreStep,
  pickContinueQuiz,
  QUIZ_QUEUE_INITIAL_DESKTOP,
  QUIZ_QUEUE_INITIAL_MOBILE,
  QUIZ_QUEUE_PAGE_SIZE,
  remainingQuizQueueCount,
  shouldShowQuizQueueLoadMore,
  sliceVisibleQueue,
  splitQuizExamSections,
} from "@/lib/quiz-exam-list";
import type { QuizCarouselItem } from "@/types/database";

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

function quiz(overrides: Partial<QuizCarouselItem> & Pick<QuizCarouselItem, "id">): QuizCarouselItem {
  return {
    title: "اختبار",
    created_by: "t1",
    category_id: null,
    topic_id: null,
    is_active: true,
    is_free: true,
    quiz_type: "regular",
    target_group_id: null,
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
    isAccessible: true,
    isLocked: false,
    questionCount: 3,
    hasSubmission: false,
    lastActivityAt: null,
    categoryName: "عام",
    lastScore: null,
    estimatedMinutes: 6,
    ...overrides,
  };
}

describe(`${FEATURE} quiz exam list sections`, () => {
  it("picks the most recent in-progress quiz for continue section", () => {
    const items = [
      quiz({
        id: "a",
        hasSubmission: true,
        lastActivityAt: "2026-06-01T10:00:00Z",
      }),
      quiz({
        id: "b",
        hasSubmission: true,
        lastActivityAt: "2026-06-10T10:00:00Z",
      }),
    ];

    expect(pickContinueQuiz(items)?.id).toBe("b");
  });

  it("splits continue quiz out of the remaining queue", () => {
    const items = [
      quiz({ id: "a", hasSubmission: true, lastActivityAt: "2026-06-10T10:00:00Z" }),
      quiz({ id: "b" }),
      quiz({ id: "c" }),
    ];

    const { continueQuiz, queueQuizzes } = splitQuizExamSections(items);
    expect(continueQuiz?.id).toBe("a");
    expect(queueQuizzes.map((q) => q.id)).toEqual(["b", "c"]);
  });

  it("filters queue quizzes by title query", () => {
    const items = [
      quiz({ id: "a", title: "تفاضل وتكامل" }),
      quiz({ id: "b", title: "هندسة" }),
    ];

    expect(filterQuizzesByQuery(items, "تفاضل").map((q) => q.id)).toEqual(["a"]);
  });

  it("uses responsive initial page sizes for the queue", () => {
    expect(QUIZ_QUEUE_INITIAL_MOBILE).toBe(3);
    expect(QUIZ_QUEUE_INITIAL_DESKTOP).toBe(8);
    expect(QUIZ_QUEUE_PAGE_SIZE).toBe(6);
  });

  it("shows all matches while searching instead of paginating", () => {
    const items = Array.from({ length: 10 }, (_, i) =>
      quiz({ id: `q${i}`, title: i < 5 ? "تفاضل" : "هندسة" })
    );
    const filtered = filterQuizzesByQuery(items, "تفاضل");

    expect(sliceVisibleQueue(filtered, 3, true)).toHaveLength(5);
    expect(shouldShowQuizQueueLoadMore(filtered, 3, true)).toBe(false);
  });

  it("paginates queue when not searching", () => {
    const items = Array.from({ length: 10 }, (_, i) => quiz({ id: `q${i}` }));

    expect(sliceVisibleQueue(items, 3, false)).toHaveLength(3);
    expect(shouldShowQuizQueueLoadMore(items, 3, false)).toBe(true);
    expect(remainingQuizQueueCount(items, 3)).toBe(7);
  });

  it("loads more by breakpoint step size", () => {
    expect(getQuizQueueLoadMoreStep(true)).toBe(3);
    expect(getQuizQueueLoadMoreStep(false)).toBe(8);
    expect(getQuizQueueInitialCount(true)).toBe(3);
    expect(getQuizQueueInitialCount(false)).toBe(8);
  });
});
