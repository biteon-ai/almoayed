import { describe, expect, it } from "vitest";
import mammoth from "mammoth";
import { buildSampleImportDocxBuffer } from "@/lib/import-docx-template";
import { SAMPLE_IMPORT_ROW } from "@/lib/import-template";
import {
  parseDocxHtmlQuestions,
  sanitizeImportRows,
} from "@/lib/parse-docx-questions";

const FEATURE = "[TEACH-012]";

describe(`${FEATURE} Word sample template round-trip`, () => {
  it("buildSampleImportDocxBuffer produces non-empty OOXML bytes", async () => {
    const bytes = await buildSampleImportDocxBuffer();
    expect(
      bytes.byteLength,
      "Sample DOCX buffer is empty — download would produce a broken file"
    ).toBeGreaterThan(100);
    expect(
      String.fromCharCode(bytes[0]!, bytes[1]!),
      "Sample DOCX is not a ZIP/OOXML package (missing PK header)"
    ).toBe("PK");
  });

  it("mammoth + parseDocxHtmlQuestions extract framed sample with correct answer", async () => {
    const bytes = await buildSampleImportDocxBuffer();
    const { value: html } = await mammoth.convertToHtml({
      buffer: Buffer.from(bytes),
    });

    expect(
      html.includes(SAMPLE_IMPORT_ROW.question_text) || html.includes("5"),
      `Mammoth HTML missing sample stem.\nHTML snippet: ${html.slice(0, 400)}`
    ).toBe(true);

    const parsed = sanitizeImportRows(parseDocxHtmlQuestions(html));
    expect(
      parsed.length,
      `Expected ≥2 questions from sample DOCX, got ${parsed.length}.\nHTML: ${html.slice(0, 500)}`
    ).toBeGreaterThanOrEqual(2);

    const row = parsed[0]!;
    expect(
      row.question_text,
      `DOCX stem missing question text.\nActual: ${row.question_text}`
    ).toMatch(/ناتج|5/);

    const options = {
      option_a: row.option_a,
      option_b: row.option_b,
      option_c: row.option_c,
      option_d: row.option_d,
    };
    expect(
      options,
      `DOCX options mismatch (letter prefix must be stripped).\nExpected: ${JSON.stringify(
        {
          option_a: SAMPLE_IMPORT_ROW.option_a,
          option_b: SAMPLE_IMPORT_ROW.option_b,
          option_c: SAMPLE_IMPORT_ROW.option_c,
          option_d: SAMPLE_IMPORT_ROW.option_d,
        }
      )}\nActual: ${JSON.stringify(options)}`
    ).toEqual({
      option_a: SAMPLE_IMPORT_ROW.option_a,
      option_b: SAMPLE_IMPORT_ROW.option_b,
      option_c: SAMPLE_IMPORT_ROW.option_c,
      option_d: SAMPLE_IMPORT_ROW.option_d,
    });

    expect(
      row.correct_answer,
      `DOCX correct_answer should come from الجواب: line.\nExpected: ${SAMPLE_IMPORT_ROW.correct_answer}\nActual: ${row.correct_answer}`
    ).toBe(SAMPLE_IMPORT_ROW.correct_answer);

    expect(row.explanation_text).toBe(SAMPLE_IMPORT_ROW.explanation_text);
    expect(row.category_tag).toBe(SAMPLE_IMPORT_ROW.category_tag);

    expect(parsed[1]?.correct_answer).toBe("ب");
    expect(parsed[1]?.option_b).toBe("-1");
  });
});
