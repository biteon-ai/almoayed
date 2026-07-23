/**
 * DOCX/HTML question parsers for bulk import (TEACH-004).
 * NOTE: Bulk Import Strategy — Append-Only — no duplicate detection; see `import-questions.ts`.
 */
import type { ImportQuestionRow } from "@/types/database";
import {
  extractTableCellTexts,
  extractTableHtmlBlocks,
  htmlToPlainMathText,
  normalizeOptionLetter,
  stripQuestionNumberPrefix,
  type OptionLetter,
} from "@/lib/docx-html-utils";

export type QuestionOptionsMap = {
  A: string;
  B: string;
  C: string;
  D: string;
};

const DEFAULT_CORRECT_AR = "أ";

export function importRowToOptionsMap(row: ImportQuestionRow): QuestionOptionsMap {
  return {
    A: row.option_a,
    B: row.option_b,
    C: row.option_c,
    D: row.option_d,
  };
}

export function optionsMapToCorrectAnswer(option: keyof QuestionOptionsMap): string {
  const map: Record<keyof QuestionOptionsMap, string> = {
    A: "أ",
    B: "ب",
    C: "ج",
    D: "د",
  };
  return map[option];
}

export function findQuestionBlockStarts(html: string): number[] {
  const normalized = html.replace(/\r\n/g, "\n");
  const indices: number[] = [];

  const marker = /<p[^>]*>\s*(?:<strong>\s*)?\(\s*(\d+)\s*(?:\)|(?=<))/gi;
  let match: RegExpExecArray | null;
  while ((match = marker.exec(normalized)) !== null) {
    indices.push(match.index);
  }

  if (indices.length === 0) {
    const fallback = /\(\s*(\d+)\s*(?:\)|\s|<)/g;
    while ((match = fallback.exec(normalized)) !== null) {
      if (!indices.includes(match.index)) {
        indices.push(match.index);
      }
    }
  }

  return indices.sort((a, b) => a - b);
}

export function splitHtmlIntoQuestionBlocks(html: string): string[] {
  const normalized = html.replace(/\r\n/g, "\n").trim();
  const parts = normalized.split(
    /(?=<p[^>]*>\s*(?:<strong>\s*)?\(\s*\d+\s*(?:\)|(?=<)))/i
  );

  return parts.map((part) => part.trim()).filter(Boolean);
}

export function parseOptionsFromTableHtml(tableHtml: string): Partial<
  Record<OptionLetter, string>
> {
  const cells = extractTableCellTexts(tableHtml);
  const options: Partial<Record<OptionLetter, string>> = {};

  for (let i = 0; i < cells.length - 1; i++) {
    const letter = normalizeOptionLetter(cells[i]);
    if (letter) {
      options[letter] = cells[i + 1].trim();
      i += 1;
    }
  }

  if (Object.keys(options).length === 0 && cells.length >= 4) {
    const letters: OptionLetter[] = ["a", "b", "c", "d"];
    for (let i = 0; i < Math.min(cells.length, 4); i++) {
      options[letters[i]] = cells[i].trim();
    }
  }

  return options;
}

export function parseQuestionBlockHtml(blockHtml: string): ImportQuestionRow | null {
  const tables = extractTableHtmlBlocks(blockHtml);
  const firstTableIndex = blockHtml.search(/<table[\s\S]*?<\/table>/i);

  const questionHtml =
    firstTableIndex >= 0 ? blockHtml.slice(0, firstTableIndex) : blockHtml;

  let question_text = stripQuestionNumberPrefix(
    htmlToPlainMathText(questionHtml)
  );

  if (!question_text) {
    question_text = stripQuestionNumberPrefix(htmlToPlainMathText(blockHtml));
  }

  const mergedOptions: Partial<Record<OptionLetter, string>> = {};
  const primaryTable = tables[0];
  if (primaryTable) {
    Object.assign(mergedOptions, parseOptionsFromTableHtml(primaryTable));
  }

  const option_a = mergedOptions.a ?? "";
  const option_b = mergedOptions.b ?? "";
  const option_c = mergedOptions.c ?? "";
  const option_d = mergedOptions.d ?? "";

  const filledOptions = [option_a, option_b, option_c, option_d].filter(Boolean);
  if (!question_text || filledOptions.length < 2) {
    return null;
  }

  return {
    question_text,
    option_a,
    option_b,
    option_c,
    option_d,
    correct_answer: DEFAULT_CORRECT_AR,
    explanation_text: "",
    category_tag: "عام",
  };
}

/**
 * Parses mammoth HTML output from standard exam .docx exports.
 * Expects numbered MCQ blocks `(1`, `(2`, … with option grids in `<table>` rows.
 */
export function parseDocxHtmlQuestions(html: string): ImportQuestionRow[] {
  const blocks = splitHtmlIntoQuestionBlocks(html);
  const rows: ImportQuestionRow[] = [];

  for (const block of blocks) {
    const row = parseQuestionBlockHtml(block);
    if (row) rows.push(row);
  }

  return rows;
}

export function isValidImportRow(row: ImportQuestionRow): boolean {
  const options = [row.option_a, row.option_b, row.option_c, row.option_d].filter(
    (value) => value.trim().length > 0
  );
  return row.question_text.trim().length > 0 && options.length >= 2;
}

export function sanitizeImportRows(rows: ImportQuestionRow[]): ImportQuestionRow[] {
  return rows.filter(isValidImportRow).map((row) => ({
    ...row,
    question_text: row.question_text.trim(),
    option_a: row.option_a.trim(),
    option_b: row.option_b.trim(),
    option_c: row.option_c.trim(),
    option_d: row.option_d.trim(),
    correct_answer: row.correct_answer.trim() || DEFAULT_CORRECT_AR,
    explanation_text: row.explanation_text.trim(),
    category_tag: row.category_tag.trim() || "عام",
  }));
}
