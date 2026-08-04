/**
 * Converts mammoth HTML fragments into readable plain text while preserving
 * mathematical notation (brackets, fractions, vectors, symbols).
 */
export function htmlToPlainMathText(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<br\s*\/?>/gi, " ")
    .replace(/<\/p>/gi, " ")
    .replace(/<\/li>/gi, " ")
    .replace(/<\/tr>/gi, " ")
    .replace(/<\/td>/gi, " ")
    .replace(/<\/th>/gi, " ")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#(\d+);/g, (_, code) =>
      String.fromCharCode(Number.parseInt(code, 10))
    )
    .replace(/\s+/g, " ")
    .trim();
}

export type OptionLetter = "a" | "b" | "c" | "d";

const OPTION_LETTER_PATTERN =
  /^(?:[aA]|أ|إ|a\.|A\.|أ\)|\(أ\)|\[a\]|\(a\))$/;
const OPTION_B_PATTERN = /^(?:[bB]|ب|b\.|B\.|ب\)|\(ب\)|\[b\]|\(b\))$/;
const OPTION_C_PATTERN = /^(?:[cC]|ج|c\.|C\.|ج\)|\(ج\)|\[c\]|\(c\))$/;
const OPTION_D_PATTERN = /^(?:[dD]|د|d\.|D\.|د\)|\(د\)|\[d\]|\(d\))$/;

export function normalizeOptionLetter(cell: string): OptionLetter | null {
  const trimmed = cell.trim();
  if (!trimmed) return null;
  if (OPTION_LETTER_PATTERN.test(trimmed)) return "a";
  if (OPTION_B_PATTERN.test(trimmed)) return "b";
  if (OPTION_C_PATTERN.test(trimmed)) return "c";
  if (OPTION_D_PATTERN.test(trimmed)) return "d";
  return null;
}

/**
 * Parses framed-exam cells like `أ) 1`, `ب) -1`, `a) 20` where letter and value
 * share one table cell (canonical Al-Moayed Word template).
 */
export function parseLabeledOptionCell(
  cell: string
): { letter: OptionLetter; text: string } | null {
  const trimmed = cell.trim();
  if (!trimmed || normalizeOptionLetter(trimmed)) return null;

  const match = trimmed.match(
    /^(أ|إ|ا|ب|ج|د|[abcdABCD])\s*[)）\]:.\-–—]?\s*(.+)$/u
  );
  if (!match?.[1] || !match[2]?.trim()) return null;

  const letter = normalizeOptionLetter(match[1]);
  if (!letter) return null;
  return { letter, text: match[2].trim() };
}

export function optionLetterToArabic(letter: OptionLetter): string {
  const map: Record<OptionLetter, string> = {
    a: "أ",
    b: "ب",
    c: "ج",
    d: "د",
  };
  return map[letter];
}

/** Strip leading exam numbering like `(1` or `(12)` and optional `س:` from question text. */
export function stripQuestionNumberPrefix(text: string): string {
  return text
    .replace(/^\(\s*\d+\s*\)?\s*[-–—.:]?\s*/, "")
    .replace(/^س\s*[:：]\s*/, "")
    .replace(/^سؤال\s*\d+\s*[:.)-]?\s*/, "")
    .trim();
}

/** Plain-text lines from successive `<p>` nodes (order preserved). */
export function extractParagraphPlainTexts(html: string): string[] {
  const paras: string[] = [];
  const pattern = /<p[^>]*>([\s\S]*?)<\/p>/gi;
  let match: RegExpExecArray | null;
  while ((match = pattern.exec(html)) !== null) {
    const text = htmlToPlainMathText(match[1] ?? "");
    if (text) paras.push(text);
  }
  return paras;
}

export function extractTableHtmlBlocks(html: string): string[] {
  const tables: string[] = [];
  const pattern = /<table[\s\S]*?<\/table>/gi;
  let match: RegExpExecArray | null;
  while ((match = pattern.exec(html)) !== null) {
    tables.push(match[0]);
  }
  return tables;
}

export function extractTableCellTexts(tableHtml: string): string[] {
  const cells: string[] = [];
  const rowPattern = /<tr[^>]*>([\s\S]*?)<\/tr>/gi;
  let rowMatch: RegExpExecArray | null;

  while ((rowMatch = rowPattern.exec(tableHtml)) !== null) {
    const cellPattern = /<t[dh][^>]*>([\s\S]*?)<\/t[dh]>/gi;
    let cellMatch: RegExpExecArray | null;
    while ((cellMatch = cellPattern.exec(rowMatch[1])) !== null) {
      cells.push(htmlToPlainMathText(cellMatch[1]));
    }
  }

  return cells.filter(Boolean);
}
