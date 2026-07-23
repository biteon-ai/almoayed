"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatPaginationRange } from "@/lib/pagination-ui";
import { cn } from "@/lib/utils";

export interface PaginationControlsProps {
  page: number;
  totalPages: number;
  total: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  /** Singular noun for the counted items, e.g. "اختبار" or "طالب". */
  itemLabel?: string;
  /** `full` shows range summary; `compact` shows page badge only. */
  variant?: "full" | "compact";
  /** When `compact`, also show "عرض X–Y من أصل Z" summary (table footers). */
  showRangeSummary?: boolean;
  className?: string;
  /** Optional Spekit / data attribute hook. */
  dataSpekit?: string;
}

/**
 * RTL-aware prev/next pagination footer shared across teacher hub lists.
 */
export function PaginationControls({
  page,
  totalPages,
  total,
  pageSize,
  onPageChange,
  itemLabel = "عنصر",
  variant = "full",
  showRangeSummary = false,
  className,
  dataSpekit,
}: PaginationControlsProps) {
  if (total === 0) return null;

  const { start, end } = formatPaginationRange(page, pageSize, total);
  const showNav = totalPages > 1;

  const navButtons = (
    <div className="flex items-center gap-2">
      <Button
        type="button"
        variant="outline"
        size="sm"
        className={cn(
          "h-8 gap-1 rounded-lg px-3 text-xs",
          variant === "full" && "h-10 px-4 text-sm"
        )}
        disabled={page <= 1}
        onClick={() => onPageChange(Math.max(1, page - 1))}
        aria-label="الصفحة السابقة"
      >
        <ChevronRight className="size-3.5" />
        السابق
      </Button>

      {variant === "compact" && (
        <span className="min-w-[3.5rem] rounded-md bg-background px-2 py-1 text-center text-[11px] font-semibold tabular-nums text-muted-foreground ring-1 ring-border/60">
          {page}/{totalPages}
        </span>
      )}

      <Button
        type="button"
        variant="outline"
        size="sm"
        className={cn(
          "h-8 gap-1 rounded-lg px-3 text-xs",
          variant === "full" && "h-10 px-4 text-sm"
        )}
        disabled={page >= totalPages}
        onClick={() => onPageChange(Math.min(totalPages, page + 1))}
        aria-label="الصفحة التالية"
      >
        التالي
        <ChevronLeft className="size-3.5" />
      </Button>
    </div>
  );

  if (variant === "compact" && !showNav) return null;

  return (
    <div
      className={cn(
        "flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between",
        className
      )}
      data-spekit={dataSpekit}
    >
      {variant === "full" ? (
        <p className="text-sm text-muted-foreground">
          عرض {start}–{end} من أصل {total} {itemLabel}
          <span className="mx-2 text-border">·</span>
          صفحة {page} من {totalPages}
        </p>
      ) : showRangeSummary ? (
        <p className="text-xs font-medium text-muted-foreground sm:text-sm">
          عرض{" "}
          <span className="tabular-nums text-foreground">
            {start}–{end}
          </span>{" "}
          من أصل{" "}
          <span className="tabular-nums text-foreground">{total}</span>{" "}
          {itemLabel}
        </p>
      ) : (
        <span className="text-xs font-medium text-muted-foreground">
          صفحة <span className="font-bold text-foreground">{page}</span> من{" "}
          <span className="font-bold text-foreground">{totalPages}</span>
        </span>
      )}

      {showNav ? navButtons : variant === "full" ? navButtons : null}
    </div>
  );
}
