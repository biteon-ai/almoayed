/** TEACH-017 — teacher quiz friendly URLs (`{titleSlug}-{id8}`). */

const TITLE_SLUG_MAX = 48;
const RESERVED_SLUGS = new Set(["new"]);
const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function truncateTitleSlug(value: string, max = TITLE_SLUG_MAX): string {
  if (value.length <= max) return value;
  const cut = value.slice(0, max);
  const lastHyphen = cut.lastIndexOf("-");
  const trimmed = lastHyphen > 0 ? cut.slice(0, lastHyphen) : cut;
  return trimmed.replace(/-+$/g, "");
}

/** Persistable path segment from quiz title + UUID. Must match SQL `quiz_friendly_slug`. */
export function buildQuizSlug(title: string, id: string): string {
  const id8 = id.replace(/-/g, "").slice(0, 8).toLowerCase();
  let titleSlug = title.normalize("NFC").trim().toLowerCase();
  titleSlug = titleSlug.replace(/[\s_]+/g, "-");
  // ES5-safe: Latin alnum + Arabic blocks (no /\p{L}/u — tsc default target is ES5)
  titleSlug = titleSlug.replace(
    /[^0-9a-z\u0600-\u06ff\u0750-\u077f\u08a0-\u08ff\ufb50-\ufdff\ufe70-\ufeff-]+/g,
    ""
  );
  titleSlug = titleSlug.replace(/-+/g, "-").replace(/^-+|-+$/g, "");
  titleSlug = truncateTitleSlug(titleSlug);

  let result = titleSlug ? `${titleSlug}-${id8}` : id8;
  if (RESERVED_SLUGS.has(result)) {
    result = `quiz-${result}`;
  }
  return result;
}

export function isQuizUuidParam(param: string): boolean {
  return UUID_RE.test(param.trim());
}

export function teacherQuizHref(
  slug: string,
  extras?: { query?: Record<string, string>; hash?: string }
): string {
  const qs = extras?.query
    ? new URLSearchParams(extras.query).toString()
    : "";
  const hash = extras?.hash
    ? `#${extras.hash.replace(/^#/, "")}`
    : "";
  return `/teacher/quizzes/${slug}${qs ? `?${qs}` : ""}${hash}`;
}
