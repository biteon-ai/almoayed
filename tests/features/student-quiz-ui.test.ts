import { describe, expect, it } from "vitest";
import {
  estimateQuizDurationMinutes,
  filterQuizzesByCategory,
  getScoreGrade,
  matchesCategoryFilter,
} from "@/lib/student-quiz-ui";

describe("student-quiz-ui", () => {
  it("estimates duration from question count", () => {
    expect(estimateQuizDurationMinutes(0)).toBe(5);
    expect(estimateQuizDurationMinutes(8)).toBe(16);
  });

  it("maps score to grade bands", () => {
    expect(getScoreGrade(85).label).toBe("ممتاز");
    expect(getScoreGrade(70).label).toBe("جيد جداً");
    expect(getScoreGrade(50).label).toBe("جيد جداً");
    expect(getScoreGrade(49).label).toBe("يحتاج مراجعة");
    expect(getScoreGrade(40).label).toBe("يحتاج مراجعة");
  });

  it("filters quizzes by category", () => {
    const quizzes = [
      { title: "A", categoryName: "رياضيات" },
      { title: "B", categoryName: "فيزياء" },
    ];

    expect(filterQuizzesByCategory(quizzes, "الكل")).toHaveLength(2);
    expect(filterQuizzesByCategory(quizzes, "رياضيات")).toHaveLength(1);
    expect(matchesCategoryFilter("عام", "عام")).toBe(true);
  });
});
