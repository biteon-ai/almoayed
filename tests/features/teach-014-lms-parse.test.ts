import { describe, expect, it } from "vitest";
import {
  LMS_QUICK_PASTE_SAMPLE,
  parseQuickPasteDocument,
  parseQuickPasteText,
  toImportRowsFromValidDrafts,
} from "@/lib/import-text";

const FEATURE = "[TEACH-014]";

describe(`${FEATURE} LMS parse`, () => {
  it("splits on Qn: without blank lines", () => {
    const text = `Q1: One?
A) a
B) b
C) c
D) d
Answer: A
Q2: Two?
A) a
B) b
C) c
D) d
Answer: B`;

    const drafts = parseQuickPasteText(text);
    expect(drafts).toHaveLength(2);
    expect(drafts[0]?.format).toBe("lms");
    expect(drafts[0]?.valid).toBe(true);
    expect(drafts[0]?.correct_answer).toBe("a");
    expect(drafts[1]?.valid).toBe(true);
    expect(drafts[1]?.correct_answer).toBe("b");
  });

  it("requires four choices and Answer letter → option text", () => {
    const text = `Q1: Pick
A) red
B) blue
C) green
D) yellow
Answer: B
Explanation: sky`;

    const [draft] = parseQuickPasteText(text);
    expect(draft?.valid).toBe(true);
    expect(draft?.correct_letter).toBe("ب");
    expect(draft?.correct_answer).toBe("blue");
    expect(draft?.explanation_text).toBe("sky");

    const { rows } = toImportRowsFromValidDrafts([draft!]);
    expect(rows[0]?.option_a).toBe("red");
    expect(rows[0]?.option_d).toBe("yellow");
    expect(rows[0]?.correct_answer).toBe("blue");
  });

  it("marks LMS blocks with fewer than 4 choices invalid", () => {
    const text = `Q1: Short
A) only
B) two
Answer: A`;

    const [draft] = parseQuickPasteText(text);
    expect(draft?.format).toBe("lms");
    expect(draft?.valid).toBe(false);
    expect(draft?.error_reason).toMatch(/أربعة/);
  });

  it("marks missing Answer invalid", () => {
    const text = `Q1: No answer
A) a
B) b
C) c
D) d`;

    const [draft] = parseQuickPasteText(text);
    expect(draft?.valid).toBe(false);
    expect(draft?.error_reason).toMatch(/Answer/i);
  });

  it("normalizes common LaTeX in stem to plain math (TEACH-016)", () => {
    const text = `Q1: Compute $x^2$ and $$\\frac{1}{2}$$
A) 1
B) 2
C) 3
D) 4
Answer: A`;

    const [draft] = parseQuickPasteText(text);
    expect(draft?.valid).toBe(true);
    expect(draft?.question_text).toContain("x^2");
    expect(draft?.question_text).toContain("1/2");
    expect(draft?.question_text).not.toMatch(/\$|\\frac/);
  });

  it("allows mixed LMS and Arabic blocks in one paste", () => {
    const text = `Q1: English?
A) a
B) b
C) c
D) d
Answer: A

(1) س: عربي؟
أ) 1
*ب) 2
ج) 3`;

    const drafts = parseQuickPasteText(text);
    expect(drafts).toHaveLength(2);
    expect(drafts[0]?.format).toBe("lms");
    expect(drafts[0]?.valid).toBe(true);
    expect(drafts[1]?.format).toBe("arabic");
    expect(drafts[1]?.valid).toBe(true);
    expect(drafts[1]?.correct_answer).toBe("2");
  });

  it("LMS_QUICK_PASTE_SAMPLE parses to ≥1 valid draft with settings", () => {
    const doc = parseQuickPasteDocument(LMS_QUICK_PASTE_SAMPLE);
    expect(doc.settings?.present).toBe(true);
    expect(doc.settings?.assessment_category).toBe("practice");
    expect(doc.settings?.max_attempts).toBe(0);
    expect(doc.settings?.is_timed).toBe(false);
    const valid = doc.drafts.filter((d) => d.valid);
    expect(valid.length).toBeGreaterThanOrEqual(2);
  });
});
