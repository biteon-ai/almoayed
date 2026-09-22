/**
 * Parse and format server timestamps in the user's local timezone.
 *
 * Postgres/Supabase `timestamptz` values sometimes arrive without a `Z` / offset.
 * Those must be treated as UTC before converting to local wall time; otherwise
 * SSR (Node UTC) and some browsers disagree with the device clock.
 */

const HAS_TZ = /(?:Z|[+-]\d{2}:?\d{2})$/i;

/** Normalize a DB/ISO timestamp string into a Date anchored correctly for local display. */
export function parseServerTimestamp(iso: string): Date | null {
  const raw = iso.trim();
  if (!raw) return null;

  let normalized = raw.includes("T") ? raw : raw.replace(" ", "T");

  if (!HAS_TZ.test(normalized)) {
    // Bare datetime from Postgres → UTC instant
    normalized = `${normalized}Z`;
  }

  const date = new Date(normalized);
  return Number.isNaN(date.getTime()) ? null : date;
}

function localTimeZone(): string | undefined {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
  } catch {
    return undefined;
  }
}

const DATE_OPTS: Intl.DateTimeFormatOptions = {
  year: "numeric",
  month: "long",
  day: "numeric",
  numberingSystem: "latn",
};

const TIME_OPTS: Intl.DateTimeFormatOptions = {
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
  numberingSystem: "latn",
};

/** Local calendar date for a submission timestamp (browser / runtime TZ). */
export function formatLocalDate(
  iso: string,
  locale = "ar-SY"
): string {
  const date = parseServerTimestamp(iso);
  if (!date) return "—";
  const timeZone = localTimeZone();
  return new Intl.DateTimeFormat(locale, {
    ...DATE_OPTS,
    ...(timeZone ? { timeZone } : {}),
  }).format(date);
}

/** Local clock time for a submission timestamp (browser / runtime TZ). */
export function formatLocalTime(
  iso: string,
  locale = "ar-SY"
): string {
  const date = parseServerTimestamp(iso);
  if (!date) return "—";
  const timeZone = localTimeZone();
  return new Intl.DateTimeFormat(locale, {
    ...TIME_OPTS,
    ...(timeZone ? { timeZone } : {}),
  }).format(date);
}

/**
 * Full local stamp: day + long month + year + 24h time
 * e.g. "22 أيلول 2026 - 23:58"
 */
export function formatLocalDateTime(
  iso: string,
  locale = "ar-SY"
): string {
  const dateLabel = formatLocalDate(iso, locale);
  const timeLabel = formatLocalTime(iso, locale);
  if (dateLabel === "—" || timeLabel === "—") return "—";
  return `${dateLabel} - ${timeLabel}`;
}
