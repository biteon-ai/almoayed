import { describe, expect, it } from "vitest";
import {
  STUDENT_RESULTS_ARCHIVE_PREVIEW_LIMIT,
  buildAttemptHistory,
  groupResultsByQuiz,
  parseAttemptSortDirection,
  previewArchiveAttempts,
  resultsHistoryHref,
  sortScoresBySubmittedAt,
  withAttemptNumbers,
} from "@/lib/student-quiz-ui";
import type { RecentScoreRow } from "@/types/database";

const FEATURE = "[UI-024]";

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

const quizAttempts: RecentScoreRow[] = [
  row({
    submissionId: "a1",
    quizId: "q1",
    quizTitle: "عقدية 1",
    score: 50,
    submittedAt: "2026-01-01T10:00:00.000Z",
  }),
  row({
    submissionId: "a2",
    quizId: "q1",
    quizTitle: "عقدية 1",
    score: 60,
    submittedAt: "2026-01-02T10:00:00.000Z",
  }),
  row({
    submissionId: "a3",
    quizId: "q1",
    quizTitle: "عقدية 1",
    score: 70,
    submittedAt: "2026-01-03T10:00:00.000Z",
  }),
  row({
    submissionId: "a4",
    quizId: "q1",
    quizTitle: "عقدية 1",
    score: 80,
    submittedAt: "2026-01-04T10:00:00.000Z",
  }),
  row({
    submissionId: "a5",
    quizId: "q1",
    quizTitle: "عقدية 1",
    score: 90,
    submittedAt: "2026-01-05T10:00:00.000Z",
  }),
  row({
    submissionId: "b1",
    quizId: "q2",
    quizTitle: "فقه",
    score: 55,
    submittedAt: "2026-01-06T10:00:00.000Z",
  }),
];

describe(`${FEATURE} attempt history helpers`, () => {
  it("parses sort direction with DESC default", () => {
    expect(parseAttemptSortDirection("asc")).toBe("asc");
    expect(parseAttemptSortDirection("desc")).toBe("desc");
    expect(parseAttemptSortDirection(null)).toBe("desc");
    expect(parseAttemptSortDirection("nope")).toBe("desc");
  });

  it("sorts attempts by submittedAt ASC and DESC", () => {
    expect(
      sortScoresBySubmittedAt(quizAttempts, "asc").map((s) => s.submissionId)
    ).toEqual(["a1", "a2", "a3", "a4", "a5", "b1"]);
    expect(
      sortScoresBySubmittedAt(quizAttempts, "desc").map((s) => s.submissionId)
    ).toEqual(["b1", "a5", "a4", "a3", "a2", "a1"]);
  });

  it("numbers attempts chronologically within each quiz", () => {
    const numbered = withAttemptNumbers(
      sortScoresBySubmittedAt(quizAttempts, "desc")
    );
    const byId = Object.fromEntries(
      numbered.map((item) => [
        item.submissionId,
        { n: item.attemptNumber, total: item.attemptTotal },
      ])
    );
    expect(byId.a1).toEqual({ n: 1, total: 5 });
    expect(byId.a5).toEqual({ n: 5, total: 5 });
    expect(byId.b1).toEqual({ n: 1, total: 1 });
  });

  it(`previews only the last ${STUDENT_RESULTS_ARCHIVE_PREVIEW_LIMIT} previous attempts in the collapse`, () => {
    const group = groupResultsByQuiz(quizAttempts).find((g) => g.quizId === "q1");
    expect(group).toBeTruthy();
    const preview = previewArchiveAttempts(
      [group!.latest, ...group!.archive],
      group!.archive
    );
    expect(preview).toHaveLength(STUDENT_RESULTS_ARCHIVE_PREVIEW_LIMIT);
    expect(preview.map((p) => p.submissionId)).toEqual(["a4", "a3", "a2"]);
    expect(preview[0]?.attemptNumber).toBe(4);
    expect(preview[0]?.attemptTotal).toBe(5);
  });

  it("builds full history in ASC and DESC order with optional quiz filter", () => {
    const desc = buildAttemptHistory(quizAttempts, "desc");
    expect(desc.map((r) => r.submissionId)).toEqual([
      "b1",
      "a5",
      "a4",
      "a3",
      "a2",
      "a1",
    ]);

    const ascQuiz = buildAttemptHistory(quizAttempts, "asc", "q1");
    expect(ascQuiz.map((r) => r.submissionId)).toEqual([
      "a1",
      "a2",
      "a3",
      "a4",
      "a5",
    ]);
    expect(ascQuiz[0]?.attemptNumber).toBe(1);
    expect(ascQuiz[4]?.attemptNumber).toBe(5);
  });

  it("builds history href with optional quiz scope", () => {
    expect(resultsHistoryHref()).toBe("/results/history");
    expect(resultsHistoryHref("q1")).toBe("/results/history?quizId=q1");
  });
});

describe(`${FEATURE} groupResultsByQuiz still groups for results cards`, () => {
  it("keeps one primary latest attempt per quiz and archives older ones DESC", () => {
    const groups = groupResultsByQuiz(quizAttempts);
    expect(groups[0]?.quizId).toBe("q2");
    const q1 = groups.find((g) => g.quizId === "q1");
    expect(q1?.latest.submissionId).toBe("a5");
    expect(q1?.archive.map((a) => a.submissionId)).toEqual([
      "a4",
      "a3",
      "a2",
      "a1",
    ]);
  });
});
