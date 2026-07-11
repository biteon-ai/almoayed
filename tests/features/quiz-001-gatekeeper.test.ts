import { describe, expect, it } from "vitest";
import {
  assertGatekeeperCompliance,
  EXAM_QUESTION_SELECT_FIELDS,
  GATEKEEPER_FORBIDDEN_FIELDS,
  toExamQuestion,
} from "@/lib/quiz-gatekeeper";
import { createExamQuestion, createQuestion } from "../helpers/quiz-factory";

const FEATURE = "[QUIZ-001]";

describe(`${FEATURE} Gatekeeper Protocol`, () => {
  it("select string excludes solution fields", () => {
    for (const field of GATEKEEPER_FORBIDDEN_FIELDS) {
      expect(EXAM_QUESTION_SELECT_FIELDS).not.toContain(field);
    }
  });

  it("toExamQuestion strips correct_answer and explanations", () => {
    const full = createQuestion();
    const exam = toExamQuestion(full);

    expect(exam).not.toHaveProperty("correct_answer");
    expect(exam).not.toHaveProperty("explanation_text");
    expect(exam).not.toHaveProperty("explanation_media_url");
    expect(exam).not.toHaveProperty("category_tag");
    expect(exam.options).toEqual(full.options);
  });

  it("assertGatekeeperCompliance passes for safe exam payloads", () => {
    const questions = [createExamQuestion(), createExamQuestion({ id: "q-2" })];
    expect(() => assertGatekeeperCompliance(questions)).not.toThrow();
  });

  it("assertGatekeeperCompliance throws when solution leaks", () => {
    const leaked = {
      ...createExamQuestion(),
      correct_answer: "4",
    };

    expect(() => assertGatekeeperCompliance([leaked])).toThrow(
      /\[QUIZ-001\] Solution leaked prior to submission/
    );
  });
});
