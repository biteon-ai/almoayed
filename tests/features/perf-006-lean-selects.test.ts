import { describe, expect, it } from "vitest";
import { QUIZ_LIST_SELECT } from "@/lib/perf-selects";
import { EXAM_QUESTION_SELECT_FIELDS } from "@/lib/quiz-gatekeeper";

describe("[PERF-006] lean select invariants", () => {
  it("quiz list select has no wildcard and no password/credential fields", () => {
    expect(QUIZ_LIST_SELECT).not.toContain("*");
    expect(QUIZ_LIST_SELECT).not.toMatch(/password|correct_answer|explanation/);
  });

  it("keeps QUIZ-001 exam select free of answer fields", () => {
    expect(EXAM_QUESTION_SELECT_FIELDS).not.toContain("correct_answer");
    expect(EXAM_QUESTION_SELECT_FIELDS).not.toContain("explanation_text");
  });
});
