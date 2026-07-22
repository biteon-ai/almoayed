export const STUDENT_PAGE_SIZE = 8;
export const QUIZ_PAGE_SIZE = 6;

export function paginateStudents<T>(
  rows: T[],
  page: number,
  pageSize: number = STUDENT_PAGE_SIZE
): { items: T[]; page: number; totalPages: number; total: number } {
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

export function paginateQuizzes<T>(
  rows: T[],
  page: number,
  pageSize: number = QUIZ_PAGE_SIZE
) {
  return paginateStudents(rows, page, pageSize);
}

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
