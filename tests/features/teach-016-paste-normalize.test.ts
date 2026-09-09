import { describe, expect, it } from "vitest";
import {
  LMS_QUICK_PASTE_SAMPLE,
  parseQuickPasteDocument,
  parseQuickPasteText,
} from "@/lib/import-text";

describe("[TEACH-016] paste normalize integration", () => {
  it("keeps plain Unicode LMS blocks valid and unchanged", () => {
    const text = `Q1: إن cos(AB, AC) يساوي:
A) 1/3
B) 7/9
C) √2/2
D) 0
Answer: B
Explanation: منتصف [AB] يعطي 1/2 .`;

    const doc = parseQuickPasteDocument(text);
    const [draft] = doc.drafts;
    expect(draft?.valid).toBe(true);
    expect(draft?.question_text).toContain("cos(AB, AC)");
    expect(draft?.option_b).toBe("7/9");
    expect(draft?.option_c).toBe("√2/2");
    expect(draft?.question_text).not.toMatch(/\$|\\frac|\\vec/);
    expect(doc.mathNotice.hadLatexInput).toBe(false);
    expect(doc.mathNotice.residualLatex).toBe(false);
  });

  it("LMS sample has no LaTeX and parses ≥1 valid draft", () => {
    expect(LMS_QUICK_PASTE_SAMPLE).not.toMatch(/\$|\\frac|\\vec|\\widehat|\\\(/);
    const doc = parseQuickPasteDocument(LMS_QUICK_PASTE_SAMPLE);
    const valid = doc.drafts.filter((d) => d.valid);
    expect(valid.length).toBeGreaterThanOrEqual(1);
    expect(doc.mathNotice.hadLatexInput).toBe(false);
  });

  it("normalizes frac/vec/$ in LMS fields and stays valid", () => {
    const text = `Q1: عند البحث عن نقطة $M$ تحقق $\\vec{BM}-\\vec{MA}=\\vec{0}$:
A) غير موجودة
B) $(1, 0, \\frac{1}{2})$
C) $(-1, -\\frac{1}{2}, -1)$
D) $(\\frac{1}{2}, 0, 1)$
Answer: D
Explanation: تكافئ $\\vec{BM}=\\vec{MA}$ .`;

    const doc = parseQuickPasteDocument(text);
    const [draft] = doc.drafts;
    expect(draft?.valid).toBe(true);
    expect(draft?.question_text).toContain("M");
    expect(draft?.question_text).toContain("BM");
    expect(draft?.option_b).toContain("1/2");
    expect(draft?.option_d).toContain("1/2");
    expect(draft?.question_text).not.toMatch(/\\frac|\\vec|\$/);
    expect(draft?.option_b).not.toMatch(/\\frac|\$/);
    expect(doc.mathNotice.hadLatexInput).toBe(true);
    expect(doc.mathNotice.convertedCount).toBeGreaterThan(0);
    expect(draft?.correct_answer).toBe(draft?.option_d);
  });

  it("obscure LaTeX residual stays structurally valid", () => {
    const text = `Q1: Compute $\\operatorname{foo}{x}$
A) 1
B) 2
C) 3
D) 4
Answer: A`;

    const [draft] = parseQuickPasteText(text);
    expect(draft?.valid).toBe(true);
    const doc = parseQuickPasteDocument(text);
    expect(doc.mathNotice.hadLatexInput).toBe(true);
    expect(doc.mathNotice.residualLatex).toBe(true);
  });

  it("preserves existing spaces between Arabic and Latin/math", () => {
    const text = `Q1: نقطة M تحقق BM - MA = 0:
A) a
B) b
C) c
D) d
Answer: A`;

    const [draft] = parseQuickPasteText(text);
    expect(draft?.valid).toBe(true);
    expect(draft?.question_text).toContain("نقطة M");
    expect(draft?.question_text).toContain("تحقق BM");
  });

  it("soft-inserts space when Arabic abuts Latin after latex strip", () => {
    const text = `Q1: نقطة$M$ تحقق:
A) a
B) b
C) c
D) d
Answer: A`;

    const [draft] = parseQuickPasteText(text);
    expect(draft?.question_text).toContain("نقطة M");
  });
});
