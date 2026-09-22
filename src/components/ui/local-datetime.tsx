"use client";

import { useEffect, useState } from "react";
import {
  formatLocalDate,
  formatLocalDateTime,
  formatLocalTime,
} from "@/lib/format-local-datetime";
import { cn } from "@/lib/utils";

type Mode = "date" | "time" | "datetime";

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
    if (mode === "datetime") {
      setLabel(formatLocalDateTime(iso));
    } else if (mode === "date") {
      setLabel(formatLocalDate(iso));
    } else {
      setLabel(formatLocalTime(iso));
    }
  }, [iso, mode]);

  return (
    <span
      dir={mode === "datetime" ? "auto" : "ltr"}
      className={cn("tabular-nums", className)}
      suppressHydrationWarning
    >
      {label}
    </span>
  );
}
