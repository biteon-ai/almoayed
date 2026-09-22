import { describe, expect, it } from "vitest";
import {
  formatLocalDate,
  formatLocalTime,
  parseServerTimestamp,
} from "@/lib/format-local-datetime";

describe("[UI-019] format-local-datetime", () => {
  it("treats bare Postgres timestamps as UTC", () => {
    const date = parseServerTimestamp("2026-09-22T12:00:00");
    expect(date).not.toBeNull();
    expect(date!.toISOString()).toBe("2026-09-22T12:00:00.000Z");
  });

  it("preserves explicit Z / offset timestamps", () => {
    expect(parseServerTimestamp("2026-09-22T12:00:00Z")!.toISOString()).toBe(
      "2026-09-22T12:00:00.000Z"
    );
    expect(
      parseServerTimestamp("2026-09-22T15:00:00+03:00")!.toISOString()
    ).toBe("2026-09-22T12:00:00.000Z");
  });

  it("formats date and time via Intl in the runtime timezone", () => {
    const iso = "2026-09-22T12:30:00.000Z";
    const dateLabel = formatLocalDate(iso, "en-GB");
    const timeLabel = formatLocalTime(iso, "en-GB");
    expect(dateLabel).not.toBe("—");
    expect(timeLabel).toMatch(/\d{2}:\d{2}/);
    // Local wall clock must reflect the Date instant (not raw UTC string dump).
    const expected = new Intl.DateTimeFormat("en-GB", {
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23",
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    }).format(new Date(iso));
    expect(timeLabel).toBe(expected);
  });

  it("returns em dash for invalid input", () => {
    expect(formatLocalDate("not-a-date")).toBe("—");
    expect(formatLocalTime("")).toBe("—");
    expect(parseServerTimestamp("bogus")).toBeNull();
  });
});
