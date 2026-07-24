import { describe, expect, it } from "vitest";
import {
  ADMIN_TEACHERS_PAGE_SIZE,
  STUDENT_HOME_QUIZ_WINDOW,
  clampPage,
  rangeFromPage,
  toPagedResult,
} from "@/lib/pagination-server";
import {
  QUIZ_PAGE_SIZE,
  STUDENT_PAGE_SIZE,
} from "@/lib/paginate-students";
import {
  STUDENT_EXAMS_PAGE_SIZE,
  STUDENT_RESULTS_PAGE_SIZE,
} from "@/lib/student-quiz-ui";

describe("[PERF-005] pagination helpers", () => {
  it("clampPage clamps past last page and keeps empty catalogs on page 1", () => {
    expect(clampPage(999, 8, 20)).toBe(3);
    expect(clampPage(0, 8, 20)).toBe(1);
    expect(clampPage(2, 8, 0)).toBe(1);
  });

  it("rangeFromPage returns inclusive PostgREST bounds", () => {
    expect(rangeFromPage(1, 8)).toEqual({ from: 0, to: 7 });
    expect(rangeFromPage(2, 8)).toEqual({ from: 8, to: 15 });
  });

  it("toPagedResult shape includes items, total, page, pageSize", () => {
    const result = toPagedResult(["a", "b"], 20, 2, 8);
    expect(result).toEqual({
      items: ["a", "b"],
      total: 20,
      page: 2,
      pageSize: 8,
    });
  });

  it("default page sizes match product constants", () => {
    expect(STUDENT_PAGE_SIZE).toBe(8);
    expect(QUIZ_PAGE_SIZE).toBe(6);
    expect(STUDENT_EXAMS_PAGE_SIZE).toBe(4);
    expect(STUDENT_RESULTS_PAGE_SIZE).toBe(4);
    expect(ADMIN_TEACHERS_PAGE_SIZE).toBe(20);
    expect(STUDENT_HOME_QUIZ_WINDOW).toBe(12);
  });
});
