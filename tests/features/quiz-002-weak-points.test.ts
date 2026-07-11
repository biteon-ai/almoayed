import { describe, expect, it } from "vitest";
import { aggregateCategoryPerformance } from "@/lib/weak-points";

const FEATURE = "[QUIZ-002]";

describe(`${FEATURE} Weak Points aggregation`, () => {
  it("returns empty array when no answers exist", () => {
    expect(aggregateCategoryPerformance([])).toEqual([]);
  });

  it("aggregates per category and sorts weakest first", () => {
    const result = aggregateCategoryPerformance([
      { is_correct: true, category_tag: "جبر" },
      { is_correct: false, category_tag: "جبر" },
      { is_correct: true, category_tag: "هندسة" },
      { is_correct: true, category_tag: "هندسة" },
      { is_correct: false, category_tag: "هندسة" },
    ]);

    expect(result[0]?.category_tag).toBe("جبر");
    expect(result[0]?.success_percentage).toBe(50);
    expect(result[1]?.category_tag).toBe("هندسة");
    expect(result[1]?.success_percentage).toBeCloseTo(66.7, 0);
  });

  it("defaults missing category_tag to عام", () => {
    const result = aggregateCategoryPerformance([
      { is_correct: false, category_tag: "" },
    ]);
    expect(result[0]?.category_tag).toBe("عام");
  });
});
