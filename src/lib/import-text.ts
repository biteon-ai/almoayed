/**
 * TEACH-013 — Quick text paste parser (blank-line MCQ blocks).
 * Does not alter TEACH-004 `parseWordLikeText` / file import paths.
 */
import type { ImportQuestionRow } from "@/types/database";
import {
  resolveCorrectOptionText,
  type ArabicOptionLetter,
} from "@/lib/question-options";

export type QuickPasteDraft = {
  index: number;
  question_text: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  correct_letter: ArabicOptionLetter | "";
  correct_answer: string;
  explanation_text: string;
  category_tag: string;
  valid: boolean;
  error_reason: string | null;
};

export const QUICK_PASTE_MAX_IMPORT = 50;

export const QUICK_PASTE_SAMPLE_FORMAT = `(1) س: ما ناتج 2 + 2؟
أ) 3
*ب) 4
ج) 5
د) 6
الشرح: جمع بسيط
التصنيف: حساب
(2) س: عاصمة سوريا؟
أ) حلب
ب) دمشق
الجواب: ب
ج) حمص
د) اللاذقية`;

const LETTERS: ArabicOptionLetter[] = ["أ", "ب", "ج", "د"];

function stripLabelPrefix(line: string, prefixes: string[]): string | null {
  for (const prefix of prefixes) {
    if (line.startsWith(prefix)) {
      return line.slice(prefix.length).trimStart();
    }
  }
  return null;
}

function normalizeChoiceLetter(raw: string): ArabicOptionLetter | null {
  const ch = raw.trim().charAt(0);
  const map: Record<string, ArabicOptionLetter> = {
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

/** `*ب) text` or `ب) text` / `b. text` */
const OPTION_LINE = /^\*?([أإابجحدa-dA-D])[\).:\-]\s*(.*)$/;

/** Word/exam style: `(1)`, `(2)`, … at line start starts a new question. */
const NUMBERED_QUESTION_START = /^\((\d+)\)\s*/;

function stripQuestionNumber(line: string): string {
  return line.replace(NUMBERED_QUESTION_START, "").trim();
}

function isNumberedQuestionStart(line: string): boolean {
  return NUMBERED_QUESTION_START.test(line.trim());
}

/**
 * Split paste into question blocks by blank lines **or** a new `(n)` marker
 * (even when there is no blank line between questions).
 */
export function splitQuickPasteBlocks(text: string): string[] {
  const lines = text.replace(/\r\n/g, "\n").split("\n");
  const blocks: string[] = [];
  let current: string[] = [];

  const flush = () => {
    if (current.some((l) => l.trim())) {
      blocks.push(current.join("\n").trim());
    }
    current = [];
  };

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) {
      flush();
      continue;
    }
    if (isNumberedQuestionStart(trimmed) && current.some((l) => l.trim())) {
      flush();
    }
    current.push(line);
  }
  flush();
  return blocks;
}

function parseOptionLine(
  line: string
): { letter: ArabicOptionLetter; text: string; starred: boolean } | null {
  const starred = line.startsWith("*");
  const match = line.match(OPTION_LINE);
  if (!match) return null;
  const letter = normalizeChoiceLetter(match[1] ?? "");
  if (!letter) return null;
  return { letter, text: (match[2] ?? "").trim(), starred };
}

function optionFieldFor(
  letter: ArabicOptionLetter
): "option_a" | "option_b" | "option_c" | "option_d" {
  const map = {
    أ: "option_a",
    ب: "option_b",
    ج: "option_c",
    د: "option_d",
  } as const;
  return map[letter];
}

function presentOptions(draft: Pick<
  QuickPasteDraft,
  "option_a" | "option_b" | "option_c" | "option_d"
>): string[] {
  return [draft.option_a, draft.option_b, draft.option_c, draft.option_d]
    .map((o) => o.trim())
    .filter(Boolean);
}

function validateDraft(
  partial: Omit<QuickPasteDraft, "valid" | "error_reason" | "correct_answer"> & {
    correct_answer?: string;
  }
): Pick<QuickPasteDraft, "valid" | "error_reason" | "correct_answer"> {
  const stem = partial.question_text.trim();
  if (!stem) {
    return {
      valid: false,
      error_reason: "نص السؤال ناقص",
      correct_answer: "",
    };
  }

  const options = presentOptions(partial);
  if (options.length < 2) {
    return {
      valid: false,
      error_reason: "يلزم خياران على الأقل",
      correct_answer: "",
    };
  }

  if (!partial.correct_letter) {
    return {
      valid: false,
      error_reason: "لم يُحدد الجواب الصحيح (*ب) أو الجواب: ب)",
      correct_answer: "",
    };
  }

  const field = optionFieldFor(partial.correct_letter);
  const optionText = partial[field]?.trim() ?? "";
  if (!optionText) {
    return {
      valid: false,
      error_reason: "حرف الجواب لا يطابق أي خيار موجود",
      correct_answer: "",
    };
  }

  const optionsOrdered = LETTERS.map((l) => partial[optionFieldFor(l)].trim()).filter(
    Boolean
  );
  const correct_answer = resolveCorrectOptionText(
    partial.correct_letter,
    optionsOrdered
  );

  return { valid: true, error_reason: null, correct_answer };
}

function parseBlock(block: string, index: number): QuickPasteDraft {
  const lines = block
    .split(/\n/)
    .map((l) => l.trim())
    .filter(Boolean);

  let question_text = "";
  const options = {
    option_a: "",
    option_b: "",
    option_c: "",
    option_d: "",
  };
  let asteriskLetter: ArabicOptionLetter | "" = "";
  let answerLineLetter: ArabicOptionLetter | "" = "";
  let explanation_text = "";
  let category_tag = "عام";
  let seenOption = false;

  for (const rawLine of lines) {
    const line = stripQuestionNumber(rawLine);

    const expl = stripLabelPrefix(line, ["شرح:", "الشرح:", "Explanation:"]);
    if (expl !== null) {
      explanation_text = expl;
      continue;
    }

    const cat = stripLabelPrefix(line, ["قسم:", "التصنيف:", "Category:"]);
    if (cat !== null) {
      category_tag = cat || "عام";
      continue;
    }

    const answerRaw = stripLabelPrefix(line, ["الجواب:", "Answer:"]);
    if (answerRaw !== null) {
      answerLineLetter = normalizeChoiceLetter(answerRaw) ?? "";
      continue;
    }

    const opt = parseOptionLine(line);
    if (opt) {
      seenOption = true;
      options[optionFieldFor(opt.letter)] = opt.text;
      if (opt.starred) asteriskLetter = opt.letter;
      continue;
    }

    if (line.startsWith("س:") || line.startsWith("Q:")) {
      const stem = line.replace(/^(س:|Q:)\s*/, "").trim();
      question_text = question_text
        ? `${question_text}\n${stem}`.trim()
        : stem;
      continue;
    }

    if (!question_text) {
      question_text = line;
    } else if (!seenOption) {
      // Multi-line stem (common in math exams) until the first option.
      question_text = `${question_text}\n${line}`.trim();
    }
  }

  const correct_letter: ArabicOptionLetter | "" =
    answerLineLetter || asteriskLetter || "";

  const base = {
    index,
    question_text,
    ...options,
    correct_letter,
    explanation_text,
    category_tag,
  };

  const validated = validateDraft(base);
  return { ...base, ...validated };
}

/** Parse pasted Arabic MCQ text into drafts (valid and invalid). */
export function parseQuickPasteText(text: string): QuickPasteDraft[] {
  const normalized = text.replace(/^\uFEFF/, "").replace(/\r\n/g, "\n");
  if (!normalized.trim()) return [];

  const blocks = splitQuickPasteBlocks(normalized);
  return blocks.map((block, index) => parseBlock(block, index));
}

export type QuickPasteImportResult = {
  rows: ImportQuestionRow[];
  imported: number;
  skippedInvalid: number;
  capped: boolean;
};

/** Map valid drafts to import rows; apply max cap (default 50). */
export function toImportRowsFromValidDrafts(
  drafts: QuickPasteDraft[],
  options?: { max?: number }
): QuickPasteImportResult {
  const max = options?.max ?? QUICK_PASTE_MAX_IMPORT;
  const valid = drafts.filter((d) => d.valid);
  const skippedInvalid = drafts.length - valid.length;
  const capped = valid.length > max;
  const selected = valid.slice(0, max);

  const rows: ImportQuestionRow[] = selected.map((d) => ({
    question_text: d.question_text.trim(),
    option_a: d.option_a.trim(),
    option_b: d.option_b.trim(),
    option_c: d.option_c.trim(),
    option_d: d.option_d.trim(),
    correct_answer: d.correct_answer.trim(),
    explanation_text: d.explanation_text.trim(),
    category_tag: d.category_tag.trim() || "عام",
  }));

  return {
    rows,
    imported: rows.length,
    skippedInvalid,
    capped,
  };
}
