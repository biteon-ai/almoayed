import { describe, expect, it } from "vitest";
import {
  detectLatexResidue,
  ensureArabicMathSpacing,
  looksLikeLatex,
  normalizeFieldMath,
  normalizeLatexToPlainMath,
} from "@/lib/plain-math";

describe("[TEACH-016] plain-math converter", () => {
  it("is idempotent on clean Unicode", () => {
    const input = "إن cos(AB, AC) يساوي 7/9 و √2";
    const once = normalizeLatexToPlainMath(input);
    expect(once.convertedCount).toBe(0);
    expect(once.residualLatex).toBe(false);
    const twice = normalizeLatexToPlainMath(once.text);
    expect(twice.text).toBe(once.text);
    expect(twice.convertedCount).toBe(0);
  });

  it("converts frac, vec, dollar delimiters", () => {
    const r = normalizeLatexToPlainMath(
      "نقطة $M$ تحقق $\\vec{BM}-\\vec{MA}=\\vec{0}$ و $\\frac{1}{2}$"
    );
    expect(r.text).toContain("M");
    expect(r.text).toContain("BM");
    expect(r.text).toContain("1/2");
    expect(r.text).not.toMatch(/\\frac|\\vec|\$/);
    expect(r.convertedCount).toBeGreaterThan(0);
    expect(r.residualLatex).toBe(false);
  });

  it("converts \\(...\\), sqrt, trig, symbols", () => {
    const r = normalizeLatexToPlainMath(
      "\\( \\sqrt{2} \\) و \\sin x و \\pm\\infty و \\cdot و \\times"
    );
    expect(r.text).toContain("√2");
    expect(r.text).toContain("sin");
    expect(r.text).toContain("±");
    expect(r.text).toContain("∞");
    expect(r.text).toContain("·");
    expect(r.text).toContain("×");
    expect(r.residualLatex).toBe(false);
  });

  it("leaves unrecognized commands as residual", () => {
    const r = normalizeLatexToPlainMath("$\\operatorname{foo}{x}$");
    expect(r.text).toMatch(/operatorname|foo/);
    expect(r.residualLatex).toBe(true);
    expect(detectLatexResidue(r.text)).toBe(true);
  });

  it("detects latex-like input", () => {
    expect(looksLikeLatex("$x$")).toBe(true);
    expect(looksLikeLatex("\\frac{1}{2}")).toBe(true);
    expect(looksLikeLatex("1/2")).toBe(false);
  });

  it("inserts Arabic–math spacing only when abutting", () => {
    expect(ensureArabicMathSpacing("نقطةM")).toBe("نقطة M");
    expect(ensureArabicMathSpacing("Mهي")).toBe("M هي");
    expect(ensureArabicMathSpacing("نقطة M")).toBe("نقطة M");
    expect(ensureArabicMathSpacing("تساوي√2")).toBe("تساوي √2");
  });

  it("does not insert space before Arabic question mark", () => {
    expect(ensureArabicMathSpacing("ما ناتج 1+1؟")).toBe("ما ناتج 1+1؟");
  });

  it("normalizeFieldMath applies spacing after latex convert", () => {
    const r = normalizeFieldMath("نقطة$M$");
    expect(r.text).toBe("نقطة M");
    expect(r.residualLatex).toBe(false);
  });
});
