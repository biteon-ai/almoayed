/** Server-side pagination helpers (PERF-005). */

export type PageInput = {
  page?: number;
  pageSize?: number;
};

export type PagedResult<T> = {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
};

/** Admin teachers directory default page size. */
export const ADMIN_TEACHERS_PAGE_SIZE = 20;

/** Student home dashboard max recent/active quizzes (not full catalog). */
export const STUDENT_HOME_QUIZ_WINDOW = 12;

/**
 * Clamp requested page into [1, lastPage]. Empty catalogs → page 1.
 */
export function clampPage(
  page: number,
  pageSize: number,
  total: number
): number {
  const safeSize = Math.max(1, pageSize);
  const lastPage = Math.max(1, Math.ceil(total / safeSize) || 1);
  const requested = Number.isFinite(page) ? Math.trunc(page) : 1;
  return Math.min(Math.max(1, requested), lastPage);
}

/** Inclusive PostgREST `.range(from, to)` bounds for a 1-based page. */
export function rangeFromPage(
  page: number,
  pageSize: number
): { from: number; to: number } {
  const safePage = Math.max(1, Math.trunc(page) || 1);
  const safeSize = Math.max(1, pageSize);
  const from = (safePage - 1) * safeSize;
  return { from, to: from + safeSize - 1 };
}

/** Build a PagedResult after clamping page against total. */
export function toPagedResult<T>(
  items: T[],
  total: number,
  page: number,
  pageSize: number
): PagedResult<T> {
  const safeSize = Math.max(1, pageSize);
  const clamped = clampPage(page, safeSize, total);
  return {
    items,
    total: Math.max(0, total),
    page: clamped,
    pageSize: safeSize,
  };
}
