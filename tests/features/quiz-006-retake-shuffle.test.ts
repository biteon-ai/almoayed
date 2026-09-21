import { describe, expect, it } from "vitest";
import { createExamQuestion } from "../helpers/quiz-factory";
import { optionLetter, isStaleInProgressDraft } from "@/lib/quiz-player";
import {
  buildAttemptPresentation,
  fisherYates,
  shuffleDistinctFrom,
  type Rng,
} from "@/lib/quiz-shuffle";
import {
  applyPresentation,
  authoredPresentation,
  isPermutation,
  presentationFromSubmitResult,
  presentationMatchesBank,
  presentationsEqual,
} from "@/lib/quiz-presentation";
import type { QuizSubmitResult } from "@/types/database";

const FEATURE = "[QUIZ-006]";

function seqRng(values: number[]): Rng {
  let index = 0;
  return () => {
    const value = values[index] ?? 0;
    index += 1;
    return value;
  };
}

describe(`${FEATURE} fisherYates`, () => {
  it("returns a new permutation with the same multiset", () => {
    const items = ["a", "b", "c", "d"];
    const shuffled = fisherYates(items, seqRng([0.9, 0.1, 0.5]));
    expect(shuffled).not.toBe(items);
    expect(isPermutation(shuffled, items)).toBe(true);
    expect(items).toEqual(["a", "b", "c", "d"]);
  });

  it("copies lists shorter than 2", () => {
    expect(fisherYates(["only"], seqRng([0.5]))).toEqual(["only"]);
    expect(fisherYates([], seqRng([0.5]))).toEqual([]);
  });
});

describe(`${FEATURE} shuffleDistinctFrom`, () => {
  it("swaps when the shuffle collides with the previous order", () => {
    const items = ["a", "b"];
    const previous = ["a", "b"];
    // rng >= 0.5 → j = 1 for i=1, identity shuffle, then swap 0/1
    const next = shuffleDistinctFrom(items, previous, seqRng([0.9, 0.9, 0.9]));
    expect(next).toEqual(["b", "a"]);
  });

  it("copies when only one order exists", () => {
    expect(shuffleDistinctFrom(["solo"], ["solo"], seqRng([0.2]))).toEqual([
      "solo",
    ]);
  });
});

describe(`${FEATURE} buildAttemptPresentation`, () => {
  it("includes every question exactly once (FR-010)", () => {
    const questions = [
      { id: "q1", options: ["a", "b", "c", "d"] },
      { id: "q2", options: ["w", "x", "y", "z"] },
      { id: "q3", options: ["1", "2", "3", "4"] },
      { id: "q4", options: ["p", "q", "r", "s"] },
    ];
    const presentation = buildAttemptPresentation({
      questions,
      previous: null,
      rng: seqRng(Array.from({ length: 40 }, (_, i) => (i % 7) / 7)),
    });
    expect(isPermutation(presentation.questionIds, questions.map((q) => q.id))).toBe(
      true
    );
    for (const question of questions) {
      expect(
        isPermutation(presentation.optionOrders[question.id] ?? [], question.options)
      ).toBe(true);
    }
  });

  it("differs from the previous attempt when another order exists (FR-008)", () => {
    const questions = [
      { id: "q1", options: ["a", "b", "c", "d"] },
      { id: "q2", options: ["w", "x", "y", "z"] },
    ];
    const previous = authoredPresentation(questions);
    const next = buildAttemptPresentation({
      questions,
      previous,
      rng: seqRng(Array.from({ length: 40 }, () => 0.99)),
    });
    expect(next.questionIds).not.toEqual(previous.questionIds);
    expect(next.optionOrders.q1).not.toEqual(previous.optionOrders.q1);
    expect(next.optionOrders.q2).not.toEqual(previous.optionOrders.q2);
  });
});

describe(`${FEATURE} applyPresentation`, () => {
  it("reorders questions and options; letters follow display index (FR-006)", () => {
    const questions = [
      createExamQuestion({
        id: "q1",
        options: ["red", "green", "blue", "yellow"],
        sort_order: 1,
      }),
      createExamQuestion({
        id: "q2",
        quiz_id: "quiz-001",
        question_text: "second",
        options: ["1", "2"],
        sort_order: 2,
      }),
    ];
    const presentation = {
      questionIds: ["q2", "q1"],
      optionOrders: {
        q1: ["yellow", "blue", "green", "red"],
        q2: ["2", "1"],
      },
    };
    const shown = applyPresentation(questions, presentation);
    expect(shown.map((q) => q.id)).toEqual(["q2", "q1"]);
    expect(shown[1]?.options[0]).toBe("yellow");
    expect(optionLetter(0)).toBe("A");
    expect(optionLetter(2)).toBe("C");
    expect(shown[1]?.options[2]).toBe("green");
  });

  it("does not treat displayed letter as the grading identity (FR-007)", () => {
    const questions = [
      createExamQuestion({
        id: "q1",
        options: ["wrong", "correct", "also-wrong", "no"],
      }),
    ];
    const shown = applyPresentation(questions, {
      questionIds: ["q1"],
      optionOrders: { q1: ["no", "also-wrong", "correct", "wrong"] },
    });
    const correctText = "correct";
    expect(shown[0]?.options[2]).toBe(correctText);
    expect(optionLetter(2)).toBe("C");
    expect(shown[0]?.options[0] === correctText).toBe(false);
  });
});

describe(`${FEATURE} isPermutation / presentationsEqual / matchesBank`, () => {
  it("isPermutation is order-insensitive", () => {
    expect(isPermutation(["b", "a"], ["a", "b"])).toBe(true);
    expect(isPermutation(["a"], ["a", "b"])).toBe(false);
  });

  it("presentationsEqual is true across reuse of the same snapshot", () => {
    const questions = [
      createExamQuestion({ id: "q1", options: ["a", "b"] }),
      createExamQuestion({ id: "q2", options: ["c", "d"], sort_order: 2 }),
    ];
    const snapshot = {
      questionIds: ["q2", "q1"],
      optionOrders: { q1: ["b", "a"], q2: ["d", "c"] },
    };
    const first = applyPresentation(questions, snapshot);
    const second = applyPresentation(questions, snapshot);
    expect(
      presentationsEqual(
        authoredPresentation(first),
        authoredPresentation(second)
      )
    ).toBe(true);
    expect(presentationMatchesBank(snapshot, questions)).toBe(true);
  });
});

describe(`${FEATURE} isStaleInProgressDraft`, () => {
  it("is stale when the stamp is missing or mismatched", () => {
    expect(
      isStaleInProgressDraft({
        usedAttempts: 1,
        draftUsedAttemptsAtStart: undefined,
        hasPendingSubmission: false,
      })
    ).toBe(true);
    expect(
      isStaleInProgressDraft({
        usedAttempts: 2,
        draftUsedAttemptsAtStart: 1,
        hasPendingSubmission: false,
      })
    ).toBe(true);
  });

  it("is not stale when the stamp matches and there is no pending submit", () => {
    expect(
      isStaleInProgressDraft({
        usedAttempts: 1,
        draftUsedAttemptsAtStart: 1,
        hasPendingSubmission: false,
      })
    ).toBe(false);
  });

  it("skips stale when a pending submission exists", () => {
    expect(
      isStaleInProgressDraft({
        usedAttempts: 1,
        draftUsedAttemptsAtStart: 0,
        hasPendingSubmission: true,
      })
    ).toBe(false);
  });
});

describe(`${FEATURE} presentationFromSubmitResult`, () => {
  it("rebuilds order from graded answers including options", () => {
    const result: QuizSubmitResult = {
      submissionId: "sub-1",
      score: 50,
      totalQuestions: 2,
      correctCount: 1,
      answers: [
        {
          questionId: "q2",
          studentAnswer: "2",
          isCorrect: true,
          correctAnswer: "2",
          explanationText: "",
          explanationMediaUrl: null,
          categoryTag: "",
          questionText: "q2",
          questionImageUrl: null,
          options: ["2", "1"],
        },
        {
          questionId: "q1",
          studentAnswer: "red",
          isCorrect: false,
          correctAnswer: "green",
          explanationText: "",
          explanationMediaUrl: null,
          categoryTag: "",
          questionText: "q1",
          questionImageUrl: null,
          options: ["yellow", "red"],
        },
      ],
    };
    const presentation = presentationFromSubmitResult(result);
    expect(presentation.questionIds).toEqual(["q2", "q1"]);
    expect(presentation.optionOrders.q2).toEqual(["2", "1"]);
  });
});
