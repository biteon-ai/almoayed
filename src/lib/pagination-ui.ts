/** Visible row range for paginated list footers (1-based, inclusive). */
export interface PaginationRange {
  start: number;
  end: number;
}

/**
 * Computes the inclusive 1-based row range shown on the current page.
 * Returns `{ start: 0, end: 0 }` when the list is empty.
 */
export function formatPaginationRange(
  page: number,
  pageSize: number,
  total: number
): PaginationRange {
  if (total === 0) return { start: 0, end: 0 };
  const start = (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, total);
  return { start, end };
}
