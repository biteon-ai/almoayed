/**
 * NOTE: Bulk Import Strategy — Append-Only
 * Duplicate detection is explicitly out of scope.
 * Every imported item is treated as a new entry with a fresh unique ID.
 *
 * Parsers in this module only skip structurally invalid rows (empty question text,
 * fewer than two options). Re-importing the same file always creates new records.
 * See also: `importQuestionRows` in `src/actions/teacher.ts`.
 */
import type { ImportQuestionRow } from "@/types/database";

export { generateSessionToken } from "@/lib/session-token";

function stripLabelPrefix(line: string, prefixes: string[]): string | null {
  for (const prefix of prefixes) {
    if (line.startsWith(prefix)) {
      return line.slice(prefix.length).trimStart();
    }
  }
  return null;
}

/** Map Latin / Arabic choice letters to the app's Arabic أ–د keys. */
function normalizeChoiceLetter(raw: string): "أ" | "ب" | "ج" | "د" | null {
  const ch = raw.trim().charAt(0);
  const map: Record<string, "أ" | "ب" | "ج" | "د"> = {
    a: "أ",
    A: "أ",
    أ: "أ",
    إ: "أ",
    ا: "أ",
    b: "ب",
    B: "ب",
    ب: "ب",
    c: "ج",
    C: "ج",
    ج: "ج",
    d: "د",
    D: "د",
    د: "د",
  };
  return map[ch] ?? null;
}

/**
 * Sanitize encoding noise. Choice-marker normalization is handled during option
 * extraction so math like `f(a)` is not corrupted.
 */
export function sanitizeArabicTxt(rawText: string): string {
  let text = rawText.replace(/^\uFEFF/, "");

  text = text
    .replace(/\uFFFD+/g, " ")
    .replace(/\u0000/g, "")
    // Isolated ?? runs (encoding noise) — avoid lookbehind for older TS targets
    .replace(/([^\w\u0600-\u06FF]|^)(\?{2,})(?=[^\w\u0600-\u06FF]|$)/g, "$1 ")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\r\n?/g, "\n");

  return text.replace(/[ \t]{2,}/g, " ").trim();
}

const QUESTION_BLOCK_REGEX =
  /(?:^|\n)(\d{1,2})\)\s+([\s\S]*?)(?=(?:\n\d{1,2}\)\s+)|$)/g;

/**
 * Option marker: `(a)`, `(a `, `(a` alone on a line, `a)`, `أ)` — Latin or Arabic.
 * Syrian .txt exports often use `(a` + newline + option text.
 */
const OPTION_MARKER_REGEX =
  /(?:^|[\s\n])(?:\(([a-dA-Dأإابججد])\)?|([a-dA-Dأإابججد])\))(?:\s+|$)/gm;

function extractInlineOptions(block: string): {
  questionText: string;
  options: Partial<Record<"أ" | "ب" | "ج" | "د", string>>;
} | null {
  const markers: { letter: "أ" | "ب" | "ج" | "د"; start: number; end: number }[] =
    [];

  OPTION_MARKER_REGEX.lastIndex = 0;
  let markerMatch: RegExpExecArray | null;
  while ((markerMatch = OPTION_MARKER_REGEX.exec(block)) !== null) {
    const raw = markerMatch[1] ?? markerMatch[2] ?? "";
    const letter = normalizeChoiceLetter(raw);
    if (!letter || markerMatch.index === undefined) continue;
    markers.push({
      letter,
      start: markerMatch.index,
      end: markerMatch.index + markerMatch[0].length,
    });
  }

  if (markers.length < 2) return null;

  // Prefer a contiguous أ→ب→ج→د (or a→b→c→d) cluster; fall back to all markers.
  let cluster = markers;
  for (let i = 0; i < markers.length; i++) {
    const slice = markers.slice(i);
    const letters = slice.map((m) => m.letter).join("");
    if (
      letters.startsWith("أب") ||
      letters.startsWith("أبج") ||
      letters.startsWith("أبجد")
    ) {
      cluster = slice;
      break;
    }
  }

  const options: Partial<Record<"أ" | "ب" | "ج" | "د", string>> = {};
  for (let i = 0; i < cluster.length; i++) {
    const current = cluster[i]!;
    const next = cluster[i + 1];
    const valueStart = current.end;
    const valueEnd = next ? next.start : block.length;
    const value = stripAnswerLabels(block.slice(valueStart, valueEnd).trim())
      .replace(/\s+/g, " ")
      .trim();
    if (value) options[current.letter] = value;
  }

  if (!options["أ"] && !options["ب"]) return null;

  const questionText = stripAnswerLabels(block.slice(0, cluster[0]!.start).trim())
    .replace(/[\s:：\-–—]+$/, "")
    .replace(/\s+/g, " ")
    .trim();

  if (!questionText) return null;
  return { questionText, options };
}

function extractAnswerFromBlock(block: string): string {
  const patterns = [
    /(?:الجواب|الإجابة|Correct|Answer)\s*[:：]\s*([a-dA-Dأإاابججد])/i,
    /(?:الجواب|الإجابة)\s+([a-dA-Dأإاابججد])\b/,
  ];
  for (const pattern of patterns) {
    const match = block.match(pattern);
    if (match?.[1]) {
      return normalizeChoiceLetter(match[1]) ?? match[1];
    }
  }
  return "";
}

function stripAnswerLabels(text: string): string {
  return text
    .replace(
      /(?:الجواب|الإجابة|Correct|Answer)\s*[:：]\s*[a-dA-Dأإاابججد]\s*/gi,
      ""
    )
    .replace(/(?:الشرح|شرح|Explanation)\s*[:：][\s\S]*$/i, "")
    .replace(/(?:التصنيف|قسم|Category)\s*[:：][\s\S]*$/i, "")
    .trim();
}

/**
 * Parse numbered Arabic/Latin MCQ `.txt` exams with inline options, e.g.
 * `1) نص السؤال (a خيار (b خيار (c خيار (d خيار`
 */
export function parseArabicTxtQuiz(rawText: string): ImportQuestionRow[] {
  const sanitized = sanitizeArabicTxt(rawText);
  if (!sanitized.trim()) return [];

  const rows: ImportQuestionRow[] = [];

  QUESTION_BLOCK_REGEX.lastIndex = 0;
  let blockMatch: RegExpExecArray | null;
  while ((blockMatch = QUESTION_BLOCK_REGEX.exec(sanitized)) !== null) {
    const blockBody = (blockMatch[2] ?? "").trim();
    if (!blockBody) continue;

    const extracted = extractInlineOptions(blockBody);
    if (!extracted) continue;

    const answerFromBlock = extractAnswerFromBlock(blockBody);
    rows.push({
      question_text: extracted.questionText,
      option_a: extracted.options["أ"] ?? "",
      option_b: extracted.options["ب"] ?? "",
      option_c: extracted.options["ج"] ?? "",
      option_d: extracted.options["د"] ?? "",
      // Default to أ when the exam file omits an answer key (teacher can edit).
      correct_answer: answerFromBlock || "أ",
      explanation_text: "",
      category_tag: "عام",
    });
  }

  return rows;
}

export function parseCsvQuestions(content: string): ImportQuestionRow[] {
  const lines = content
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);

  if (lines.length < 2) return [];

  const headers = lines[0].split(",").map((h) => h.trim().toLowerCase());
  const rows: ImportQuestionRow[] = [];

  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(",").map((c) => c.trim());
    const row: Record<string, string> = {};
    headers.forEach((h, idx) => {
      row[h] = cols[idx] ?? "";
    });

    if (!row.question_text) continue;

    rows.push({
      question_text: row.question_text,
      option_a: row.option_a ?? row.a ?? "",
      option_b: row.option_b ?? row.b ?? "",
      option_c: row.option_c ?? row.c ?? "",
      option_d: row.option_d ?? row.d ?? "",
      correct_answer: row.correct_answer ?? row.answer ?? "",
      explanation_text: row.explanation_text ?? row.explanation ?? "",
      category_tag: row.category_tag ?? row.category ?? "عام",
    });
  }

  return rows;
}

export async function parseXlsxQuestions(
  buffer: ArrayBuffer
): Promise<ImportQuestionRow[]> {
  const XLSX = await import("xlsx");
  const workbook = XLSX.read(buffer, { type: "array" });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const json = XLSX.utils.sheet_to_json<Record<string, string>>(sheet, {
    defval: "",
  });

  return json
    .filter((r) => r.question_text?.trim())
    .map((r) => ({
      question_text: String(r.question_text ?? "").trim(),
      option_a: String(r.option_a ?? r.A ?? "").trim(),
      option_b: String(r.option_b ?? r.B ?? "").trim(),
      option_c: String(r.option_c ?? r.C ?? "").trim(),
      option_d: String(r.option_d ?? r.D ?? "").trim(),
      correct_answer: String(r.correct_answer ?? r.answer ?? "").trim(),
      explanation_text: String(r.explanation_text ?? r.explanation ?? "").trim(),
      category_tag: String(r.category_tag ?? r.category ?? "عام").trim(),
    }));
}

/** Labeled block format: `س:` / `أ)` / `الجواب:` (TEACH-004). */
function parseLabeledWordBlocks(content: string): ImportQuestionRow[] {
  const blocks = content.split(/\n\s*\n/).filter(Boolean);
  const rows: ImportQuestionRow[] = [];

  for (const block of blocks) {
    const lines = block
      .split(/\n/)
      .map((l) => l.trim())
      .filter(Boolean);
    if (!lines.length) continue;

    const row: ImportQuestionRow = {
      question_text: "",
      option_a: "",
      option_b: "",
      option_c: "",
      option_d: "",
      correct_answer: "",
      explanation_text: "",
      category_tag: "عام",
    };

    for (const line of lines) {
      if (line.startsWith("س:") || line.startsWith("Q:")) {
        row.question_text = line.replace(/^(س:|Q:)\s*/, "");
      } else if (/^[أإaA][\).:-]/.test(line)) {
        row.option_a = line.replace(/^[أإaA][\).:-]\s*/, "");
      } else if (/^[بbB][\).:-]/.test(line)) {
        row.option_b = line.replace(/^[بbB][\).:-]\s*/, "");
      } else if (/^[جcC][\).:-]/.test(line)) {
        row.option_c = line.replace(/^[جcC][\).:-]\s*/, "");
      } else if (/^[دdD][\).:-]/.test(line)) {
        row.option_d = line.replace(/^[دdD][\).:-]\s*/, "");
      } else if (line.startsWith("الجواب:") || line.startsWith("Answer:")) {
        row.correct_answer = line.replace(/^(الجواب:|Answer:)\s*/, "");
      } else if (
        stripLabelPrefix(line, ["شرح:", "الشرح:", "Explanation:"]) !== null
      ) {
        row.explanation_text =
          stripLabelPrefix(line, ["شرح:", "الشرح:", "Explanation:"]) ?? "";
      } else if (
        stripLabelPrefix(line, ["قسم:", "التصنيف:", "Category:"]) !== null
      ) {
        row.category_tag =
          stripLabelPrefix(line, ["قسم:", "التصنيف:", "Category:"]) ?? "عام";
      } else if (!row.question_text) {
        row.question_text = line;
      }
    }

    if (row.question_text && row.correct_answer) rows.push(row);
  }

  return rows;
}

/**
 * Parse `.txt` / Word-like text: labeled blocks first, then numbered inline MCQ.
 * Prefer whichever strategy yields more questions (labeled-only short-circuit dropped
 * rows when a single labeled block matched but inline had the full exam).
 */
export function parseWordLikeText(content: string): ImportQuestionRow[] {
  const labeled = parseLabeledWordBlocks(content);
  const inline = parseArabicTxtQuiz(content);
  if (inline.length > labeled.length) return inline;
  if (labeled.length > 0) return labeled;
  return inline;
}

/** Decode `.txt` bytes — Arabic Windows exports are often CP1256, not UTF-8. */
export function decodeImportTextBuffer(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  const utf8 = new TextDecoder("utf-8").decode(bytes);
  const replacements = utf8.match(/\uFFFD/g)?.length ?? 0;

  // Heuristic: CP1256 Arabic read as UTF-8 produces many replacement chars.
  if (replacements > Math.max(4, bytes.length * 0.02)) {
    try {
      return new TextDecoder("windows-1256").decode(bytes);
    } catch {
      /* Node without windows-1256 — fall through */
    }
  }

  return utf8;
}

export function importRowsToQuestionInserts(rows: ImportQuestionRow[]) {
  return rows.map((r, idx) => {
    const options = [r.option_a, r.option_b, r.option_c, r.option_d].filter(
      Boolean
    );
    return {
      question_text: r.question_text,
      options,
      correct_answer: r.correct_answer,
      explanation_text: r.explanation_text || "",
      category_tag: r.category_tag || "عام",
      sort_order: idx + 1,
    };
  });
}
