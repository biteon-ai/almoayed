"use client";

import { useEffect, useState } from "react";
import {
  formatLocalDate,
  formatLocalTime,
} from "@/lib/format-local-datetime";
import { cn } from "@/lib/utils";

type Mode = "date" | "time";

/**
 * Renders a server timestamp in the viewer's local timezone after mount
 * so SSR (UTC) does not flash or stick the wrong clock.
 */
export function LocalDateTime({
  iso,
  mode,
  className,
}: {
  iso: string;
  mode: Mode;
  className?: string;
}) {
  const [label, setLabel] = useState("—");

  useEffect(() => {
    setLabel(mode === "date" ? formatLocalDate(iso) : formatLocalTime(iso));
  }, [iso, mode]);

  return (
    <span dir="ltr" className={cn("tabular-nums", className)} suppressHydrationWarning>
      {label}
    </span>
  );
}
