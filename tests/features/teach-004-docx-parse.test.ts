import { describe, expect, it } from "vitest";
import {
  htmlToPlainMathText,
  normalizeOptionLetter,
  stripQuestionNumberPrefix,
} from "@/lib/docx-html-utils";
import {
  importRowToOptionsMap,
  parseDocxHtmlQuestions,
  parseOptionsFromTableHtml,
  parseQuestionBlockHtml,
  sanitizeImportRows,
} from "@/lib/parse-docx-questions";

const FEATURE = "[TEACH-004]";

const SAMPLE_EXAM_HTML = `
<p><strong>(1</strong> ) إذا كان f(x) = x² − 4 فما مجموعة حل |f(x)| ≤ 3 ؟</p>
<table>
  <tr>
    <td><p>a</p></td><td><p>[-2, 2]</p></td>
    <td><p>b</p></td><td><p>(5/3, -10/3, -1/3)</p></td>
    <td><p>c</p></td><td><p>{1, 2}</p></td>
    <td><p>d</p></td><td><p>∅</p></td>
  </tr>
</table>
<p><strong>(2</strong> ) احسب ناتج المشتقة عند x = 0:</p>
<table>
  <tr>
    <td>أ</td><td>0</td>
    <td>ب</td><td>1/2</td>
    <td>ج</td><td>−1</td>
    <td>د</td><td>2</td>
  </tr>
</table>
`;

describe(`${FEATURE} DOCX HTML exam parser`, () => {
  it("htmlToPlainMathText preserves brackets and fractions", () => {
    const text = htmlToPlainMathText(
      "<p>[-2, 2] و <strong>(5/3, -10/3)</strong></p>"
    );
    expect(text).toContain("[-2, 2]");
    expect(text).toContain("(5/3, -10/3)");
  });

  it("normalizeOptionLetter maps Arabic and Latin labels", () => {
    expect(normalizeOptionLetter("a")).toBe("a");
    expect(normalizeOptionLetter("أ")).toBe("a");
    expect(normalizeOptionLetter("ب")).toBe("b");
    expect(normalizeOptionLetter("ج")).toBe("c");
    expect(normalizeOptionLetter("د")).toBe("d");
  });

  it("stripQuestionNumberPrefix removes (N markers", () => {
    expect(stripQuestionNumberPrefix("(1 ) نص السؤال")).toBe("نص السؤال");
    expect(stripQuestionNumberPrefix("(12) نص")).toBe("نص");
  });

  it("parseOptionsFromTableHtml reads grid row a-d values", () => {
    const table = `<table><tr>
      <td>a</td><td>[-2, 2]</td>
      <td>b</td><td>1</td>
      <td>c</td><td>2</td>
      <td>d</td><td>3</td>
    </tr></table>`;
    const options = parseOptionsFromTableHtml(table);
    expect(options.a).toBe("[-2, 2]");
    expect(options.b).toBe("1");
    expect(options.c).toBe("2");
    expect(options.d).toBe("3");
  });

  it("parseQuestionBlockHtml extracts question and four options", () => {
    const block = SAMPLE_EXAM_HTML.split("<p><strong>(2")[0] ?? "";
    const row = parseQuestionBlockHtml(block);
    expect(row?.question_text).toContain("f(x)");
    expect(row?.option_a).toBe("[-2, 2]");
    expect(row?.option_d).toBe("∅");
    expect(row?.correct_answer).toBe("أ");
  });

  it("parseDocxHtmlQuestions splits multiple numbered MCQs", () => {
    const rows = parseDocxHtmlQuestions(SAMPLE_EXAM_HTML);
    expect(rows).toHaveLength(2);
    expect(rows[1]?.option_b).toBe("1/2");
  });

  it("importRowToOptionsMap produces A-D structured map", () => {
    const rows = parseDocxHtmlQuestions(SAMPLE_EXAM_HTML);
    const map = importRowToOptionsMap(rows[0]!);
    expect(map.A).toBe("[-2, 2]");
    expect(map.D).toBe("∅");
  });

  it("parseOptionsFromTableHtml reads framed أ) value cells", () => {
    const table = `<table><tr>
      <td><p>أ) 1</p></td>
      <td><p>ب) -1</p></td>
      <td><p>ج) 2</p></td>
      <td><p>د) 0</p></td>
    </tr></table>`;
    const options = parseOptionsFromTableHtml(table);
    expect(options.a).toBe("1");
    expect(options.b).toBe("-1");
    expect(options.c).toBe("2");
    expect(options.d).toBe("0");
  });

  it("parseQuestionBlockHtml reads الجواب الشرح التصنيف from framed block", () => {
    const block = `
<p><strong>(1) س: إذا كانت الدالة f(x) = x² - 4x + 3، فما هي القيمة الصغرى للدالة؟</strong></p>
<table><tr>
  <td><p>أ) 1</p></td><td><p>ب) -1</p></td>
  <td><p>ج) 2</p></td><td><p>د) 0</p></td>
</tr></table>
<p><strong>الجواب: ب</strong></p>
<p>الشرح: القيمة الصغرى عند الرأس.</p>
<p>التصنيف: الجبر - الدوال التربيعية</p>`;
    const row = parseQuestionBlockHtml(block);
    expect(row?.question_text).toContain("f(x)");
    expect(row?.question_text).not.toMatch(/^س:/);
    expect(row?.option_a).toBe("1");
    expect(row?.option_b).toBe("-1");
    expect(row?.correct_answer).toBe("ب");
    expect(row?.explanation_text).toContain("الرأس");
    expect(row?.category_tag).toContain("الجبر");
  });

  it("parseDocxHtmlQuestions imports multi-question framed formal exam HTML", () => {
    const formal = `
<p><strong>(1) س: سؤال واحد؟</strong></p>
<table><tr><td><p>أ) 1</p></td><td><p>ب) 2</p></td><td><p>ج) 3</p></td><td><p>د) 4</p></td></tr></table>
<p><strong>الجواب: ب</strong></p>
<p>الشرح: اثنان</p>
<p>التصنيف: تجريبي</p>
<p><strong>(2) س: سؤال اثنان؟</strong></p>
<table><tr><td><p>أ) 10</p></td><td><p>ب) 20</p></td><td><p>ج) 30</p></td><td><p>د) 40</p></td></tr></table>
<p><strong>الجواب: ج</strong></p>
<p>الشرح: ثلاثون</p>
<p>التصنيف: تجريبي</p>`;
    const rows = sanitizeImportRows(parseDocxHtmlQuestions(formal));
    expect(rows).toHaveLength(2);
    expect(rows[0]?.correct_answer).toBe("ب");
    expect(rows[0]?.option_a).toBe("1");
    expect(rows[0]?.option_a).not.toContain("أ");
    expect(rows[1]?.correct_answer).toBe("ج");
    expect(rows[1]?.option_c).toBe("30");
  });

  it("sanitizeImportRows drops blocks missing options", () => {
    const invalid = sanitizeImportRows([
      {
        question_text: "سؤال بدون خيارات",
        option_a: "",
        option_b: "",
        option_c: "",
        option_d: "",
        correct_answer: "أ",
        explanation_text: "",
        category_tag: "عام",
      },
    ]);
    expect(invalid).toHaveLength(0);
  });
});
