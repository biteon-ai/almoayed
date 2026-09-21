import { describe, expect, it } from "vitest";
import {
  compactPagerWindow,
  firstUnansweredIndex,
  isQuizComplete,
  remainingUnanswered,
  rtlCompactPagerSlots,
  stepNavState,
} from "@/lib/quiz-player";

const FEATURE = "[UI-017]";

describe(`${FEATURE} isQuizComplete`, () => {
  it("is false for an empty quiz even with extra answer keys", () => {
    expect(isQuizComplete({ answers: { stray: "A" }, questionIds: [] })).toBe(
      false
    );
  });

  it("is false when any question id is missing or trim-empty", () => {
    expect(
      isQuizComplete({
        answers: { q1: "A", q2: "  " },
        questionIds: ["q1", "q2"],
      })
    ).toBe(false);
    expect(
      isQuizComplete({
        answers: { q1: "A" },
        questionIds: ["q1", "q2"],
      })
    ).toBe(false);
  });

  it("ignores extra answer keys and does not read correct-answer fields", () => {
    expect(
      isQuizComplete({
        answers: { q1: "A", q2: "B", extra: "C", correctAnswer: "leak" },
        questionIds: ["q1", "q2"],
      })
    ).toBe(true);
  });
});

describe(`${FEATURE} remainingUnanswered`, () => {
  it("counts question ids that fail the non-empty check", () => {
    expect(
      remainingUnanswered({
        answers: { q1: "A", q2: " ", q3: "" },
        questionIds: ["q1", "q2", "q3"],
      })
    ).toBe(2);
  });

  it("returns 0 when complete and the full count when empty", () => {
    expect(
      remainingUnanswered({
        answers: { q1: "A", q2: "B" },
        questionIds: ["q1", "q2"],
      })
    ).toBe(0);
    expect(remainingUnanswered({ answers: {}, questionIds: [] })).toBe(0);
    expect(
      remainingUnanswered({ answers: { extra: "x" }, questionIds: ["q1"] })
    ).toBe(1);
  });
});

describe(`${FEATURE} stepNavState`, () => {
  it("disables previous on the first question", () => {
    expect(stepNavState({ activeIndex: 0, questionCount: 3 })).toEqual({
      canPrev: false,
      canNext: true,
    });
  });

  it("disables next on the last question", () => {
    expect(stepNavState({ activeIndex: 2, questionCount: 3 })).toEqual({
      canPrev: true,
      canNext: false,
    });
  });

  it("disables both on a single-question or empty quiz", () => {
    expect(stepNavState({ activeIndex: 0, questionCount: 1 })).toEqual({
      canPrev: false,
      canNext: false,
    });
    expect(stepNavState({ activeIndex: 0, questionCount: 0 })).toEqual({
      canPrev: false,
      canNext: false,
    });
  });

  it("treats activeIndex <= 0 as no previous", () => {
    expect(stepNavState({ activeIndex: -1, questionCount: 4 })).toEqual({
      canPrev: false,
      canNext: true,
    });
  });
});

describe(`${FEATURE} firstUnansweredIndex`, () => {
  it("returns the first question id that fails the non-empty check", () => {
    expect(
      firstUnansweredIndex({
        answers: { q1: "A", q2: " " },
        questionIds: ["q1", "q2", "q3"],
      })
    ).toBe(1);
  });

  it("returns 0 when complete or when the list is empty", () => {
    expect(
      firstUnansweredIndex({
        answers: { q1: "A", q2: "B" },
        questionIds: ["q1", "q2"],
      })
    ).toBe(0);
    expect(firstUnansweredIndex({ answers: {}, questionIds: [] })).toBe(0);
  });
});

describe(`${FEATURE} compactPagerWindow`, () => {
  it("keeps the current index in the middle with neighbors on Q5", () => {
    expect(compactPagerWindow(4, 10)).toEqual({
      prev: 3,
      current: 4,
      next: 5,
      canPrev: true,
      canNext: true,
    });
  });

  it("leaves empty previous on the first question and empty next on the last", () => {
    expect(compactPagerWindow(0, 10)).toEqual({
      prev: null,
      current: 0,
      next: 1,
      canPrev: false,
      canNext: true,
    });
    expect(compactPagerWindow(9, 10)).toEqual({
      prev: 8,
      current: 9,
      next: null,
      canPrev: true,
      canNext: false,
    });
  });
});

describe(`${FEATURE} rtlCompactPagerSlots`, () => {
  it("places next on the left and previous on the right (Q7)", () => {
    expect(rtlCompactPagerSlots(6, 10)).toEqual({
      left: 7,
      current: 6,
      right: 5,
      canGoLeft: true,
      canGoRight: true,
    });
  });

  it("disables the left (next) arrow on the last question", () => {
    expect(rtlCompactPagerSlots(9, 10)).toEqual({
      left: null,
      current: 9,
      right: 8,
      canGoLeft: false,
      canGoRight: true,
    });
  });
});
