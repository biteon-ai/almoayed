import { describe, expect, it } from "vitest";
import { groupResultsByQuiz } from "@/lib/student-quiz-ui";
import type { RecentScoreRow } from "@/types/database";

const FEATURE = "[UI-019]";

function row(
  partial: Partial<RecentScoreRow> &
    Pick<RecentScoreRow, "submissionId" | "quizId" | "submittedAt" | "score">
): RecentScoreRow {
  return {
    quizTitle: partial.quizTitle ?? `Quiz ${partial.quizId}`,
    categoryName: partial.categoryName ?? "عام",
    ...partial,
  };
}

describe(`${FEATURE} groupResultsByQuiz`, () => {
  it("keeps one primary latest attempt per quiz and archives older ones DESC", () => {
    const scores = [
      row({
        submissionId: "a1",
        quizId: "q1",
        quizTitle: "عقدية 1",
        score: 70,
        submittedAt: "2026-01-01T10:00:00.000Z",
      }),
      row({
        submissionId: "a3",
        quizId: "q1",
        quizTitle: "عقدية 1",
        score: 90,
        submittedAt: "2026-01-03T10:00:00.000Z",
      }),
      row({
        submissionId: "a2",
        quizId: "q1",
        quizTitle: "عقدية 1",
        score: 80,
        submittedAt: "2026-01-02T10:00:00.000Z",
      }),
      row({
        submissionId: "b1",
        quizId: "q2",
        quizTitle: "فقه",
        score: 55,
        submittedAt: "2026-01-04T10:00:00.000Z",
      }),
    ];

    const groups = groupResultsByQuiz(scores);
    expect(groups).toHaveLength(2);
    expect(groups[0]?.quizId).toBe("q2");
    expect(groups[0]?.latest.submissionId).toBe("b1");
    expect(groups[0]?.archive).toEqual([]);

    expect(groups[1]?.quizId).toBe("q1");
    expect(groups[1]?.latest.submissionId).toBe("a3");
    expect(groups[1]?.archive.map((a) => a.submissionId)).toEqual(["a2", "a1"]);
  });

  it("returns empty for empty input", () => {
    expect(groupResultsByQuiz([])).toEqual([]);
  });
});
