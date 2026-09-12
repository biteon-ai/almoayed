/**
 * TEACH-013 / TEACH-014 / TEACH-016 — Quick text paste parser.
 * Supports Arabic MCQ blocks and English LMS (`Qn:` / `Answer:`) plus optional
 * `=== Quiz Settings ===` header. TEACH-016 normalizes common LaTeX in field text
 * to plain Unicode. Does not alter TEACH-004 file import paths.
 */
import type { AssessmentCategory, ImportQuestionRow } from "@/types/database";
import {
  resolveCorrectOptionText,
  type ArabicOptionLetter,
} from "@/lib/question-options";
import { validateMaxAttempts } from "@/lib/quiz-attempts";
import {
  QUIZ_TIMER_MAX_MINUTES,
  QUIZ_TIMER_MIN_MINUTES,
  validateDurationMinutes,
} from "@/lib/quiz-timer";
import {
  EMPTY_MATH_NOTICE,
  looksLikeLatex,
  mergeMathNotices,
  normalizeFieldMath,
  type QuickPasteMathNotice,
} from "@/lib/plain-math";

export type { QuickPasteMathNotice } from "@/lib/plain-math";

export type QuickPasteFormat = "lms" | "arabic";

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
  format: QuickPasteFormat;
};

export type ParsedQuizSettings = {
  present: boolean;
  assessment_category: AssessmentCategory | null;
  assessment_category_error: string | null;
  max_attempts: number | null;
  max_attempts_error: string | null;
  is_timed: boolean | null;
  duration_minutes: number | null;
  timer_error: string | null;
  warnings: string[];
};

export type QuickPasteDocument = {
  settings: ParsedQuizSettings | null;
  drafts: QuickPasteDraft[];
  mathNotice: QuickPasteMathNotice;
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

export const LMS_QUICK_PASTE_SAMPLE = `=== Quiz Settings ===
Quiz Type: Practice / Homework
Number of Attempts: Unlimited
Enable Timer: No
Quiz Duration: 30

=== Quiz Questions ===

Q1: What is 2 + 2?
A) 3
B) 4
C) 5
D) 6
Answer: B
Explanation: Basic arithmetic

Q2: If M is the midpoint of [AB], then M equals:
A) (1, 0, 1/2)
B) (-1, -1/2, -1)
C) (1/2, 0, 1)
D) non-existent
Answer: C
Explanation: Midpoint uses (x1+x2)/2 ; example √2 stays plain.`;

/**
 * Prompt teachers copy into Gemini / ChatGPT / etc. so image→text or rewrite
 * output pastes cleanly into «لصق نصي سريع» (TEACH-013/014/016).
 */
export const QUICK_PASTE_LLM_PROMPT = `You convert quiz images or messy quiz text into Al-Moayed (المؤيد) paste format for «لصق نصي سريع».

OUTPUT RULES (mandatory):
1) Prefer ENGLISH LMS format (best for mixed Arabic + math):
=== Quiz Settings ===
Quiz Type: Practice / Homework
Number of Attempts: Unlimited
Enable Timer: No
Quiz Duration: 30

=== Quiz Questions ===

Q1: [Arabic or English stem here]
A) ...
B) ...
C) ...
D) ...
Answer: B
Explanation: ...

Q2: ...
(blank line between questions)

Alternative ARABIC format (also accepted):
(1) س: ...
أ) ...
*ب) ...
ج) ...
د) ...
الشرح: ...
التصنيف: ...

(2) س: ...
أ) ...
ب) ...
الجواب: ب
ج) ...
د) ...

2) MATH — plain Unicode ONLY. Never use $, $$, \\( \\), \\frac, \\vec, \\sum, or any LaTeX.
   - Fractions: 1/2 , (2n-3)/5
   - Powers / indices: n^2 , Un or U_n
   - Roots: √2
   - Sequences example: Un = 2n - 3
   - Vectors / segments: AB , [AB] , BM - MA = 0

3) BiDi / Arabic safety (critical — prevents digit scrambling like 32n instead of 2n - 3):
   - Always put a SPACE between every Arabic word and any Latin/math token.
   - Keep operators in logical LTR order: Un = 2n - 3  (never 32n - Un =).
   - Prefer: لدينا المتتالية Un معرفة بـ : Un = 2n - 3 .
   - Never glue: قيمةU0  → write: قيمة U0

4) Preserve mathematical meaning exactly from the image/source. If unclear, write [غير واضح] instead of guessing.

5) Exactly 4 choices for LMS (A–D). Answer must be the letter. Explanation optional but recommended.

6) Output plain text only — no markdown code fences, no commentary before/after the quiz text.

After you finish, I will copy your entire output into Al-Moayed «لصق نصي سريع».`;

const LETTERS: ArabicOptionLetter[] = ["أ", "ب", "ج", "د"];

const QN_START = /^Q(\d+):\s*/i;
const NUMBERED_QUESTION_START = /^\((\d+)\)\s*/;
const OPTION_LINE = /^\*?([أإابجحدa-dA-D])[\).:\-]\s*(.*)$/;
const SETTINGS_HEADER = /^===\s*Quiz Settings\s*===\s*$/i;
const QUESTIONS_HEADER = /^===\s*Quiz Questions\s*===\s*$/i;

function stripLabelPrefix(line: string, prefixes: string[]): string | null {
  for (const prefix of prefixes) {
    if (line.startsWith(prefix) || line.toLowerCase().startsWith(prefix.toLowerCase())) {
      const idx = line.toLowerCase().indexOf(prefix.toLowerCase());
      return line.slice(idx + prefix.length).trimStart();
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

function stripQuestionNumber(line: string): string {
  return line.replace(NUMBERED_QUESTION_START, "").trim();
}

function isNumberedQuestionStart(line: string): boolean {
  return NUMBERED_QUESTION_START.test(line.trim());
}

function isQnStart(line: string): boolean {
  return QN_START.test(line.trim());
}

function stripQnPrefix(line: string): string {
  return line.replace(QN_START, "").trim();
}

/**
 * Split paste into question blocks by blank lines, `(n)`, or `Qn:`.
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
    if (QUESTIONS_HEADER.test(trimmed)) {
      continue;
    }
    const startsNew =
      (isNumberedQuestionStart(trimmed) || isQnStart(trimmed)) &&
      current.some((l) => l.trim());
    if (startsNew) {
      flush();
    }
    current.push(line);
  }
  flush();
  return blocks;
}

export function mapLmsQuizType(raw: string): AssessmentCategory | null {
  const v = raw.trim().toLowerCase();
  if (!v) return null;
  if (
    v.includes("practice") ||
    v.includes("homework") ||
    v.includes("تدريب") ||
    v.includes("واجب")
  ) {
    return "practice";
  }
  if (
    v.includes("challenge") ||
    v.includes("competition") ||
    v.includes("تحدي") ||
    v.includes("مسابقة")
  ) {
    return "challenge";
  }
  if (
    v.includes("assessment") ||
    v.includes("evaluation") ||
    v.includes("تقييم") ||
    v.includes("نصفي")
  ) {
    return "evaluation";
  }
  return null;
}

function parseYesNo(raw: string): boolean | null {
  const v = raw.trim().toLowerCase();
  if (["yes", "y", "true", "1", "نعم", "on"].includes(v)) return true;
  if (["no", "n", "false", "0", "لا", "off"].includes(v)) return false;
  return null;
}

/** Extract and parse optional === Quiz Settings === header. */
export function extractQuizSettingsHeader(text: string): {
  settings: ParsedQuizSettings | null;
  body: string;
} {
  const normalized = text.replace(/^\uFEFF/, "").replace(/\r\n/g, "\n");
  const lines = normalized.split("\n");
  const startIdx = lines.findIndex((l) => SETTINGS_HEADER.test(l.trim()));
  if (startIdx < 0) {
    return { settings: null, body: normalized };
  }

  const fieldLines: string[] = [];
  let endIdx = lines.length;
  for (let i = startIdx + 1; i < lines.length; i++) {
    const t = lines[i]?.trim() ?? "";
    if (QUESTIONS_HEADER.test(t) || isQnStart(t) || isNumberedQuestionStart(t)) {
      endIdx = i;
      break;
    }
    if (t) fieldLines.push(t);
  }

  const body = [...lines.slice(0, startIdx), ...lines.slice(endIdx)]
    .join("\n")
    .trim();

  const fields: Record<string, string> = {};
  for (const line of fieldLines) {
    const m = line.match(/^([^:]+):\s*(.*)$/);
    if (m) {
      fields[m[1]!.trim().toLowerCase()] = m[2]!.trim();
    }
  }

  const warnings: string[] = [];
  let assessment_category: AssessmentCategory | null = null;
  let assessment_category_error: string | null = null;
  const typeRaw =
    fields["quiz type"] ?? fields["type"] ?? fields["نوع الاختبار"] ?? "";
  if (typeRaw) {
    assessment_category = mapLmsQuizType(typeRaw);
    if (!assessment_category) {
      assessment_category_error = "نوع الاختبار غير معروف";
      warnings.push(assessment_category_error);
    }
  }

  let max_attempts: number | null = null;
  let max_attempts_error: string | null = null;
  const attemptsRaw =
    fields["number of attempts"] ??
    fields["attempts"] ??
    fields["عدد المحاولات"] ??
    "";
  if (attemptsRaw) {
    const lower = attemptsRaw.toLowerCase();
    if (
      lower.includes("unlimited") ||
      lower.includes("غير محدود") ||
      lower === "0"
    ) {
      max_attempts = 0;
    } else {
      const validated = validateMaxAttempts({
        unlimited: false,
        value: attemptsRaw,
      });
      if (validated.ok) {
        max_attempts = validated.value;
      } else {
        max_attempts_error = validated.error;
        warnings.push(validated.error);
      }
    }
  }

  let is_timed: boolean | null = null;
  let duration_minutes: number | null = null;
  let timer_error: string | null = null;
  const timerRaw =
    fields["enable timer"] ?? fields["timer"] ?? fields["تفعيل التوقيت"] ?? "";
  const durationRaw =
    fields["quiz duration"] ??
    fields["duration"] ??
    fields["مدة الاختبار"] ??
    "";

  if (timerRaw) {
    const enabled = parseYesNo(timerRaw);
    if (enabled === false) {
      is_timed = false;
      duration_minutes = null;
    } else if (enabled === true) {
      if (!durationRaw.trim()) {
        timer_error =
          "مدة الاختبار مطلوبة عند تفعيل التوقيت — لم يُطبَّق التوقيت";
        warnings.push(timer_error);
      } else {
        const validated = validateDurationMinutes(durationRaw);
        if (validated.ok) {
          is_timed = true;
          duration_minutes = validated.value;
        } else {
          timer_error = validated.error;
          warnings.push(validated.error);
        }
      }
    } else {
      timer_error = "قيمة تفعيل التوقيت غير صالحة";
      warnings.push(timer_error);
    }
  } else if (durationRaw.trim()) {
    const validated = validateDurationMinutes(durationRaw);
    if (!validated.ok) {
      timer_error = validated.error;
      warnings.push(validated.error);
    }
  }

  return {
    settings: {
      present: true,
      assessment_category,
      assessment_category_error,
      max_attempts,
      max_attempts_error,
      is_timed,
      duration_minutes,
      timer_error,
      warnings,
    },
    body,
  };
}

/** Build partial flags for updateQuizFlags from parsed settings. */
export function settingsToQuizFlags(settings: ParsedQuizSettings): {
  flags: {
    assessment_category?: AssessmentCategory;
    max_attempts?: number;
    is_timed?: boolean;
    duration_minutes?: number | null;
  };
  applied: string[];
  skipped: string[];
} {
  const flags: {
    assessment_category?: AssessmentCategory;
    max_attempts?: number;
    is_timed?: boolean;
    duration_minutes?: number | null;
  } = {};
  const applied: string[] = [];
  const skipped: string[] = [];

  if (settings.assessment_category) {
    flags.assessment_category = settings.assessment_category;
    applied.push("نوع الاختبار");
  } else if (settings.assessment_category_error) {
    skipped.push("نوع الاختبار");
  }

  if (settings.max_attempts !== null) {
    flags.max_attempts = settings.max_attempts;
    applied.push("عدد المحاولات");
  } else if (settings.max_attempts_error) {
    skipped.push("عدد المحاولات");
  }

  if (settings.is_timed !== null) {
    flags.is_timed = settings.is_timed;
    flags.duration_minutes = settings.is_timed
      ? settings.duration_minutes
      : null;
    applied.push("التوقيت");
  } else if (settings.timer_error) {
    skipped.push("التوقيت");
  }

  return { flags, applied, skipped };
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

function detectBlockFormat(lines: string[]): QuickPasteFormat {
  for (const raw of lines) {
    const t = raw.trim();
    if (isQnStart(t)) return "lms";
  }
  // English Answer: with Latin A) style options → LMS
  const hasAnswer = lines.some((l) =>
    /^Answer:\s*/i.test(l.trim())
  );
  const hasLatinOpts = lines.some((l) =>
    /^\*?[a-dA-D][\).:\-]/.test(l.trim())
  );
  if (hasAnswer && hasLatinOpts) return "lms";
  return "arabic";
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
  const minOptions = partial.format === "lms" ? 4 : 2;
  if (options.length < minOptions) {
    return {
      valid: false,
      error_reason:
        partial.format === "lms"
          ? "يلزم أربعة خيارات (A–D)"
          : "يلزم خياران على الأقل",
      correct_answer: "",
    };
  }

  if (!partial.correct_letter) {
    return {
      valid: false,
      error_reason:
        partial.format === "lms"
          ? "لم يُحدد Answer: (حرف A–D)"
          : "لم يُحدد الجواب الصحيح (*ب) أو الجواب: ب)",
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

  const optionsOrdered = LETTERS.map((l) =>
    partial[optionFieldFor(l)].trim()
  ).filter(Boolean);
  const correct_answer = resolveCorrectOptionText(
    partial.correct_letter,
    optionsOrdered
  );

  return { valid: true, error_reason: null, correct_answer };
}

function applyPlainMathToFields(fields: {
  question_text: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  explanation_text: string;
}): {
  fields: typeof fields;
  notice: QuickPasteMathNotice;
} {
  const keys = [
    "question_text",
    "option_a",
    "option_b",
    "option_c",
    "option_d",
    "explanation_text",
  ] as const;

  let notice: QuickPasteMathNotice = { ...EMPTY_MATH_NOTICE };
  const next = { ...fields };

  for (const key of keys) {
    const raw = fields[key];
    if (looksLikeLatex(raw)) {
      notice = mergeMathNotices(notice, {
        convertedCount: 0,
        residualLatex: false,
        hadLatexInput: true,
      });
    }
    const result = normalizeFieldMath(raw);
    next[key] = result.text;
    notice = mergeMathNotices(notice, {
      convertedCount: result.convertedCount,
      residualLatex: result.residualLatex,
      hadLatexInput: false,
    });
  }

  return { fields: next, notice };
}

function parseBlock(block: string, index: number): {
  draft: QuickPasteDraft;
  notice: QuickPasteMathNotice;
} {
  const lines = block
    .split(/\n/)
    .map((l) => l.trim())
    .filter(Boolean);

  const format = detectBlockFormat(lines);

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
    let line = stripQuestionNumber(rawLine);
    if (isQnStart(line)) {
      line = stripQnPrefix(line);
      // After strip, remainder is stem (may be empty if Q1: alone)
      if (line) {
        question_text = question_text
          ? `${question_text}\n${line}`.trim()
          : line;
      }
      continue;
    }

    const expl = stripLabelPrefix(line, [
      "شرح:",
      "الشرح:",
      "Explanation:",
    ]);
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

    // Avoid treating `Q1:`-only leftovers; bare `Q:` / `س:` Arabic stem labels
    if (/^س:\s*/.test(line) || /^Q:\s*(?!\d)/.test(line)) {
      const stem = line.replace(/^(س:|Q:)\s*/i, "").trim();
      question_text = question_text
        ? `${question_text}\n${stem}`.trim()
        : stem;
      continue;
    }

    if (!question_text) {
      question_text = line;
    } else if (!seenOption) {
      question_text = `${question_text}\n${line}`.trim();
    }
  }

  const correct_letter: ArabicOptionLetter | "" =
    answerLineLetter || asteriskLetter || "";

  const { fields: mathFields, notice } = applyPlainMathToFields({
    question_text,
    ...options,
    explanation_text,
  });

  const base = {
    index,
    question_text: mathFields.question_text,
    option_a: mathFields.option_a,
    option_b: mathFields.option_b,
    option_c: mathFields.option_c,
    option_d: mathFields.option_d,
    correct_letter,
    explanation_text: mathFields.explanation_text,
    category_tag,
    format,
  };

  const validated = validateDraft(base);
  return { draft: { ...base, ...validated }, notice };
}

/** Full document parse: optional settings + drafts + math notice. */
export function parseQuickPasteDocument(text: string): QuickPasteDocument {
  const normalized = text.replace(/^\uFEFF/, "").replace(/\r\n/g, "\n");
  if (!normalized.trim()) {
    return { settings: null, drafts: [], mathNotice: { ...EMPTY_MATH_NOTICE } };
  }

  const { settings, body } = extractQuizSettingsHeader(normalized);
  if (!body.trim()) {
    return {
      settings,
      drafts: [],
      mathNotice: { ...EMPTY_MATH_NOTICE },
    };
  }

  const blocks = splitQuickPasteBlocks(body);
  let mathNotice: QuickPasteMathNotice = { ...EMPTY_MATH_NOTICE };
  const drafts = blocks.map((block, index) => {
    const { draft, notice } = parseBlock(block, index);
    mathNotice = mergeMathNotices(mathNotice, notice);
    return draft;
  });
  return { settings, drafts, mathNotice };
}

/** Parse pasted MCQ text into drafts (valid and invalid). */
export function parseQuickPasteText(text: string): QuickPasteDraft[] {
  return parseQuickPasteDocument(text).drafts;
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

export { QUIZ_TIMER_MIN_MINUTES, QUIZ_TIMER_MAX_MINUTES };
