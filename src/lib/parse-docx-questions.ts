/**
 * DOCX/HTML question parsers for bulk import (TEACH-004 / TEACH-012).
 * NOTE: Bulk Import Strategy — Append-Only — no duplicate detection; see `import-questions.ts`.
 *
 * Supports:
 * 1) Letter/value alternating table cells (`a` | `20` | `b` | `25` …)
 * 2) Framed formal exam cells (`أ) 1` | `ب) -1` …) + `الجواب:` / `الشرح:` / `التصنيف:` after the table
 */
import type { ImportQuestionRow } from "@/types/database";
import {
  extractParagraphPlainTexts,
  extractTableCellTexts,
  htmlToPlainMathText,
  normalizeOptionLetter,
  optionLetterToArabic,
  parseLabeledOptionCell,
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
  const labeled: Partial<Record<OptionLetter, string>> = {};
  let labeledCount = 0;

  for (const cell of cells) {
    const parsed = parseLabeledOptionCell(cell);
    if (parsed) {
      labeled[parsed.letter] = parsed.text;
      labeledCount += 1;
    }
  }
  if (labeledCount >= 2) {
    return labeled;
  }

  const options: Partial<Record<OptionLetter, string>> = {};
  for (let i = 0; i < cells.length - 1; i++) {
    const letter = normalizeOptionLetter(cells[i] ?? "");
    if (letter) {
      options[letter] = (cells[i + 1] ?? "").trim();
      i += 1;
    }
  }

  if (Object.keys(options).length === 0 && cells.length >= 4) {
    const letters: OptionLetter[] = ["a", "b", "c", "d"];
    for (let i = 0; i < Math.min(cells.length, 4); i++) {
      options[letters[i]] = (cells[i] ?? "").trim();
    }
  }

  return options;
}

function stripLabelPrefix(line: string, prefixes: string[]): string | null {
  for (const prefix of prefixes) {
    if (line.startsWith(prefix)) {
      return line.slice(prefix.length).trim();
    }
  }
  return null;
}

/** Reads الجواب / الشرح / التصنيف lines after the options table. */
export function extractDocxBlockMeta(afterTableHtml: string): {
  correct_answer: string;
  explanation_text: string;
  category_tag: string;
} {
  const result = {
    correct_answer: DEFAULT_CORRECT_AR,
    explanation_text: "",
    category_tag: "عام",
  };

  const lines = extractParagraphPlainTexts(afterTableHtml);
  for (const line of lines) {
    const answerRaw = stripLabelPrefix(line, ["الجواب:", "الجواب：", "Answer:"]);
    if (answerRaw !== null) {
      const letter = normalizeOptionLetter(answerRaw.split(/\s+/)[0] ?? "");
      if (letter) {
        result.correct_answer = optionLetterToArabic(letter);
      }
      continue;
    }

    const explanation = stripLabelPrefix(line, [
      "الشرح:",
      "الشرح：",
      "شرح:",
      "Explanation:",
    ]);
    if (explanation !== null) {
      result.explanation_text = explanation;
      continue;
    }

    const category = stripLabelPrefix(line, [
      "التصنيف:",
      "التصنيف：",
      "قسم:",
      "Category:",
    ]);
    if (category !== null) {
      result.category_tag = category || "عام";
    }
  }

  return result;
}

export function parseQuestionBlockHtml(blockHtml: string): ImportQuestionRow | null {
  const firstTableMatch = blockHtml.match(/<table[\s\S]*?<\/table>/i);
  const firstTableIndex = firstTableMatch?.index ?? -1;
  const firstTableHtml = firstTableMatch?.[0] ?? "";

  const questionHtml =
    firstTableIndex >= 0 ? blockHtml.slice(0, firstTableIndex) : blockHtml;

  let question_text = stripQuestionNumberPrefix(
    htmlToPlainMathText(questionHtml)
  );

  if (!question_text) {
    question_text = stripQuestionNumberPrefix(htmlToPlainMathText(blockHtml));
  }

  const mergedOptions: Partial<Record<OptionLetter, string>> = {};
  if (firstTableHtml) {
    Object.assign(mergedOptions, parseOptionsFromTableHtml(firstTableHtml));
  }

  const option_a = mergedOptions.a ?? "";
  const option_b = mergedOptions.b ?? "";
  const option_c = mergedOptions.c ?? "";
  const option_d = mergedOptions.d ?? "";

  const filledOptions = [option_a, option_b, option_c, option_d].filter(Boolean);
  if (!question_text || filledOptions.length < 2) {
    return null;
  }

  const afterTableHtml =
    firstTableIndex >= 0 && firstTableHtml
      ? blockHtml.slice(firstTableIndex + firstTableHtml.length)
      : "";
  const meta = extractDocxBlockMeta(afterTableHtml);

  return {
    question_text,
    option_a,
    option_b,
    option_c,
    option_d,
    correct_answer: meta.correct_answer,
    explanation_text: meta.explanation_text,
    category_tag: meta.category_tag,
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
