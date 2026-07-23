/** Default page size for the teacher student hub table. */
export const STUDENT_PAGE_SIZE = 8;

/** Default page size for the teacher quiz management list. */
export const QUIZ_PAGE_SIZE = 6;

export interface PaginationSlice<T> {
  items: T[];
  page: number;
  totalPages: number;
  total: number;
}

/**
 * Slices `rows` into a single page and clamps `page` to valid bounds.
 * Empty lists still report `totalPages: 1` and `page: 1`.
 */
export function paginateStudents<T>(
  rows: T[],
  page: number,
  pageSize: number = STUDENT_PAGE_SIZE
): PaginationSlice<T> {
  const total = rows.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize) || 1);
  const safePage = Math.min(Math.max(1, page), totalPages);
  const start = (safePage - 1) * pageSize;
  return {
    items: rows.slice(start, start + pageSize),
    page: safePage,
    totalPages,
    total,
  };
}

/** Alias for quiz lists — same algorithm, different default page size. */
export function paginateQuizzes<T>(
  rows: T[],
  page: number,
  pageSize: number = QUIZ_PAGE_SIZE
): PaginationSlice<T> {
  return paginateStudents(rows, page, pageSize);
}

/**
 * Case-insensitive filter on student display name and WhatsApp digits.
 */
export function filterStudentsByQuery<
  T extends { fullName: string; whatsappNumber: string },
>(rows: T[], query: string): T[] {
  const q = query.trim().toLowerCase();
  if (!q) return rows;
  const digits = q.replace(/\D/g, "");
  return rows.filter((s) => {
    const nameMatch = s.fullName.toLowerCase().includes(q);
    const wa = s.whatsappNumber.toLowerCase();
    const waMatch = wa.includes(q) || (digits.length > 0 && wa.includes(digits));
    return nameMatch || waMatch;
  });
}
