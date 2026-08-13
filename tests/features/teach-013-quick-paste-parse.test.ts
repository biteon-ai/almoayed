import { describe, expect, it } from "vitest";
import {
  parseQuickPasteText,
  QUICK_PASTE_SAMPLE_FORMAT,
  toImportRowsFromValidDrafts,
} from "@/lib/import-text";

const FEATURE = "[TEACH-013]";

describe(`${FEATURE} quick paste parse`, () => {
  it("splits blank-line blocks and accepts plain or س: stems", () => {
    const text = `ما ناتج 1+1؟
أ) 1
*ب) 2

س: لون السماء؟
أ) أحمر
ب) أزرق
الجواب: ب`;

    const drafts = parseQuickPasteText(text);
    expect(drafts).toHaveLength(2);
    expect(drafts[0]?.question_text).toBe("ما ناتج 1+1؟");
    expect(drafts[0]?.valid).toBe(true);
    expect(drafts[0]?.correct_answer).toBe("2");
    expect(drafts[1]?.question_text).toBe("لون السماء؟");
    expect(drafts[1]?.valid).toBe(true);
    expect(drafts[1]?.correct_answer).toBe("أزرق");
  });

  it("accepts *letter) and الجواب: with الجواب winning on conflict", () => {
    const text = `س: سؤال؟
*أ) واحد
ب) اثنان
الجواب: ب`;

    const [draft] = parseQuickPasteText(text);
    expect(draft?.valid).toBe(true);
    expect(draft?.correct_letter).toBe("ب");
    expect(draft?.correct_answer).toBe("اثنان");
  });

  it("marks fewer than two options invalid with Arabic reason", () => {
    const text = `س: ناقص؟
أ) فقط
الجواب: أ`;

    const [draft] = parseQuickPasteText(text);
    expect(draft?.valid).toBe(false);
    expect(draft?.error_reason).toMatch(/خياران/);
  });

  it("maps Latin a–d aliases", () => {
    const text = `Q: Sum?
*a) 1
b) 2
c) 3
d) 4`;

    const [draft] = parseQuickPasteText(text);
    expect(draft?.valid).toBe(true);
    expect(draft?.correct_letter).toBe("أ");
    expect(draft?.correct_answer).toBe("1");
    expect(draft?.option_b).toBe("2");
  });

  it("does not pad missing options with empty slots in present set", () => {
    const text = `س: ثنائي؟
أ) نعم
*ب) لا`;

    const [draft] = parseQuickPasteText(text);
    expect(draft?.valid).toBe(true);
    expect(draft?.option_c).toBe("");
    expect(draft?.option_d).toBe("");
    const { rows } = toImportRowsFromValidDrafts([draft!]);
    // importRowsToQuestionInserts filters empties; row fields may be empty strings
    expect(rows[0]?.option_c).toBe("");
    expect(rows[0]?.option_d).toBe("");
  });

  it("mixed valid/invalid sets flags and Arabic error_reason", () => {
    const text = `س: صالح؟
أ) 1
*ب) 2

س: بلا جواب؟
أ) x
ب) y`;

    const drafts = parseQuickPasteText(text);
    expect(drafts[0]?.valid).toBe(true);
    expect(drafts[1]?.valid).toBe(false);
    expect(drafts[1]?.error_reason).toBeTruthy();
  });

  it("QUICK_PASTE_SAMPLE_FORMAT parses to ≥1 valid draft", () => {
    const drafts = parseQuickPasteText(QUICK_PASTE_SAMPLE_FORMAT);
    const valid = drafts.filter((d) => d.valid);
    expect(valid.length).toBeGreaterThanOrEqual(1);
    expect(valid.every((d) => d.correct_answer.length > 0)).toBe(true);
  });

  it("treats (n) as the start of a new question without blank lines", () => {
    const text = `(1) س: ما ناتج 1+1؟
أ) 1
*ب) 2
ج) 3
د) 4
(2) س: عاصمة سوريا؟
أ) حلب
ب) دمشق
الجواب: ب
ج) حمص
د) اللاذقية
(3) س: لون السماء؟
أ) أحمر
*ب) أزرق`;

    const drafts = parseQuickPasteText(text);
    expect(drafts).toHaveLength(3);
    expect(drafts[0]?.question_text).toBe("ما ناتج 1+1؟");
    expect(drafts[0]?.valid).toBe(true);
    expect(drafts[0]?.correct_answer).toBe("2");
    expect(drafts[1]?.question_text).toBe("عاصمة سوريا؟");
    expect(drafts[1]?.valid).toBe(true);
    expect(drafts[1]?.correct_answer).toBe("دمشق");
    expect(drafts[2]?.question_text).toBe("لون السماء؟");
    expect(drafts[2]?.valid).toBe(true);
    expect(drafts[2]?.correct_answer).toBe("أزرق");
  });

  it("keeps multi-line stems under a single (n) until options", () => {
    const text = `(1) س: احسب
$\\lim_{x \\to 0} x$
أ) 0
*ب) 1
(2) س: ناتج 3+3؟
أ) 5
*ب) 6`;

    const drafts = parseQuickPasteText(text);
    expect(drafts).toHaveLength(2);
    expect(drafts[0]?.question_text).toContain("احسب");
    expect(drafts[0]?.question_text).toContain("\\lim");
    expect(drafts[0]?.valid).toBe(true);
    expect(drafts[1]?.question_text).toBe("ناتج 3+3؟");
    expect(drafts[1]?.valid).toBe(true);
  });
});
