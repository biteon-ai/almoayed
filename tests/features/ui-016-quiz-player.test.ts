import { describe, expect, it } from "vitest";
import {
  answeredProgress,
  optionLetter,
  questionNavStatus,
  quizPlayerExitHref,
  shouldConfirmQuizExit,
} from "@/lib/quiz-player";

const FEATURE = "[UI-016]";

describe(`${FEATURE} optionLetter`, () => {
  it("maps 0..3 to A B C D", () => {
    expect(optionLetter(0)).toBe("A");
    expect(optionLetter(1)).toBe("B");
    expect(optionLetter(2)).toBe("C");
    expect(optionLetter(3)).toBe("D");
  });
});

describe(`${FEATURE} answeredProgress`, () => {
  it("returns 0 percent and Arabic label when total is 0", () => {
    expect(answeredProgress(0, 0)).toEqual({ percent: 0, label: "0 من 0" });
  });

  it("rounds percent and formats N من M", () => {
    expect(answeredProgress(2, 10)).toEqual({ percent: 20, label: "2 من 10" });
    expect(answeredProgress(3, 3)).toEqual({ percent: 100, label: "3 من 3" });
  });
});

describe(`${FEATURE} questionNavStatus`, () => {
  const ids = ["q1", "q2", "q3"];

  it("marks the current index active even if answered", () => {
    expect(
      questionNavStatus({
        index: 1,
        activeIndex: 1,
        questionId: ids[1],
        isSubmitted: false,
        answers: { q2: "B" },
        results: null,
      })
    ).toBe("active");
  });

  it("marks other answered items without using correct keys", () => {
    expect(
      questionNavStatus({
        index: 0,
        activeIndex: 1,
        questionId: ids[0],
        isSubmitted: false,
        answers: { q1: "A" },
        results: null,
      })
    ).toBe("answered");
  });

  it("marks unanswered taking items as default", () => {
    expect(
      questionNavStatus({
        index: 2,
        activeIndex: 0,
        questionId: ids[2],
        isSubmitted: false,
        answers: {},
        results: null,
      })
    ).toBe("default");
  });

  it("uses review correct/wrong/unanswered without a correctAnswer field on taking args", () => {
    const results = {
      answers: [
        { questionId: "q1", isCorrect: true },
        { questionId: "q2", isCorrect: false },
      ],
    };
    expect(
      questionNavStatus({
        index: 0,
        activeIndex: 2,
        questionId: "q1",
        isSubmitted: true,
        answers: {},
        results,
      })
    ).toBe("correct");
    expect(
      questionNavStatus({
        index: 1,
        activeIndex: 2,
        questionId: "q2",
        isSubmitted: true,
        answers: {},
        results,
      })
    ).toBe("wrong");
    expect(
      questionNavStatus({
        index: 2,
        activeIndex: 0,
        questionId: "q3",
        isSubmitted: true,
        answers: {},
        results,
      })
    ).toBe("unanswered-review");
  });
});

describe(`${FEATURE} shouldConfirmQuizExit`, () => {
  it("is true only for an in-progress taking canvas", () => {
    expect(
      shouldConfirmQuizExit({
        isSubmitted: false,
        pendingSync: false,
        questionCount: 10,
        timeExpiredNotice: false,
      })
    ).toBe(true);
  });

  it("is false after submit, pending sync, empty quiz, or expiry notice", () => {
    expect(
      shouldConfirmQuizExit({
        isSubmitted: true,
        pendingSync: false,
        questionCount: 10,
        timeExpiredNotice: false,
      })
    ).toBe(false);
    expect(
      shouldConfirmQuizExit({
        isSubmitted: false,
        pendingSync: true,
        questionCount: 10,
        timeExpiredNotice: false,
      })
    ).toBe(false);
    expect(
      shouldConfirmQuizExit({
        isSubmitted: false,
        pendingSync: false,
        questionCount: 0,
        timeExpiredNotice: false,
      })
    ).toBe(false);
    expect(
      shouldConfirmQuizExit({
        isSubmitted: false,
        pendingSync: false,
        questionCount: 10,
        timeExpiredNotice: true,
      })
    ).toBe(false);
  });
});

describe(`${FEATURE} quizPlayerExitHref`, () => {
  it("sends review / post-submit back to /results", () => {
    expect(
      quizPlayerExitHref({
        isSubmitted: false,
        reviewSubmissionId: "sub-1",
      })
    ).toBe("/results");
    expect(
      quizPlayerExitHref({ isSubmitted: true, reviewSubmissionId: null })
    ).toBe("/results");
  });

  it("sends an active attempt back to /quizzes", () => {
    expect(
      quizPlayerExitHref({ isSubmitted: false, reviewSubmissionId: null })
    ).toBe("/quizzes");
    expect(
      quizPlayerExitHref({ isSubmitted: false, reviewSubmissionId: "  " })
    ).toBe("/quizzes");
  });
});
