"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { paginateStudents } from "@/lib/paginate-students";

export interface UsePaginationResult<T> {
  items: T[];
  page: number;
  totalPages: number;
  total: number;
  setPage: (page: number | ((prev: number) => number)) => void;
  /** Reset to page 1 — call when filters or search change. */
  resetPage: () => void;
}

/**
 * Client-side pagination with automatic page clamping when the filtered list shrinks.
 *
 * @example
 * ```tsx
 * const { items, page, totalPages, setPage, resetPage } = usePagination(filtered, 8);
 * ```
 */
export function usePagination<T>(
  rows: T[],
  pageSize: number
): UsePaginationResult<T> {
  const [page, setPage] = useState(1);

  const result = useMemo(
    () => paginateStudents(rows, page, pageSize),
    [rows, page, pageSize]
  );

  useEffect(() => {
    if (page !== result.page) setPage(result.page);
  }, [page, result.page]);

  const resetPage = useCallback(() => setPage(1), []);

  return {
    items: result.items,
    page: result.page,
    totalPages: result.totalPages,
    total: result.total,
    setPage,
    resetPage,
  };
}
