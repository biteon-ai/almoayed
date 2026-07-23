import { describe, expect, it } from "vitest";
import { formatPaginationRange } from "@/lib/pagination-ui";
import {
  paginateStudents,
  paginateQuizzes,
  QUIZ_PAGE_SIZE,
  STUDENT_PAGE_SIZE,
} from "@/lib/paginate-students";
import { STUDENT_EXAMS_PAGE_SIZE, STUDENT_RESULTS_PAGE_SIZE } from "@/lib/student-quiz-ui";

describe("pagination-ui", () => {
  it("formatPaginationRange returns zero range for empty lists", () => {
    expect(formatPaginationRange(1, 8, 0)).toEqual({ start: 0, end: 0 });
  });

  it("formatPaginationRange computes inclusive bounds", () => {
    expect(formatPaginationRange(1, 8, 20)).toEqual({ start: 1, end: 8 });
    expect(formatPaginationRange(3, 8, 20)).toEqual({ start: 17, end: 20 });
  });
});

describe("usePagination helpers (paginate-students)", () => {
  it("exports stable default page sizes", () => {
    expect(STUDENT_PAGE_SIZE).toBe(8);
    expect(QUIZ_PAGE_SIZE).toBe(6);
    expect(STUDENT_EXAMS_PAGE_SIZE).toBe(4);
    expect(STUDENT_RESULTS_PAGE_SIZE).toBe(4);
  });

  it("paginates student exams four cards per page", () => {
    const rows = Array.from({ length: 10 }, (_, i) => ({ id: i }));
    const result = paginateStudents(rows, 2, STUDENT_EXAMS_PAGE_SIZE);
    expect(result.items).toHaveLength(4);
    expect(result.page).toBe(2);
    expect(result.totalPages).toBe(3);
  });

  it("paginateQuizzes delegates to paginateStudents with quiz page size", () => {
    const rows = Array.from({ length: 10 }, (_, i) => ({ id: i }));
    const result = paginateQuizzes(rows, 2);
    expect(result.items).toHaveLength(4);
    expect(result.page).toBe(2);
    expect(result.totalPages).toBe(2);
  });

  it("clamps overflow page numbers", () => {
    const rows = [{ id: 1 }, { id: 2 }];
    expect(paginateStudents(rows, 99).page).toBe(1);
    expect(paginateStudents(rows, 0).page).toBe(1);
  });
});
