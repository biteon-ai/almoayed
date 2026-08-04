import { describe, expect, it } from "vitest";
import {
  buildSampleImportSheetRows,
  IMPORT_COLUMN_DEFINITIONS,
  SAMPLE_IMPORT_ROW,
} from "@/lib/import-template";
import { parseXlsxQuestions } from "@/lib/import-questions";

const FEATURE = "[TEACH-012]";

describe(`${FEATURE} Excel sample template round-trip`, () => {
  it("headers match IMPORT_COLUMN_DEFINITIONS field names in order", () => {
    const [headers] = buildSampleImportSheetRows();
    const expected = IMPORT_COLUMN_DEFINITIONS.map((col) => col.field);

    expect(
      headers,
      `Excel template header drift.\nExpected: ${expected.join(", ")}\nActual:   ${(headers ?? []).join(", ")}`
    ).toEqual(expected);
  });

  it("sample data row matches SAMPLE_IMPORT_ROW field-wise", () => {
    const [, sampleRow] = buildSampleImportSheetRows();
    for (const col of IMPORT_COLUMN_DEFINITIONS) {
      const index = IMPORT_COLUMN_DEFINITIONS.findIndex((c) => c.field === col.field);
      const actual = sampleRow?.[index];
      const expected = SAMPLE_IMPORT_ROW[col.field];
      expect(
        actual,
        `Sample Excel cell mismatch for field "${col.field}".\nExpected: ${JSON.stringify(expected)}\nActual:   ${JSON.stringify(actual)}`
      ).toBe(expected);
    }
  });

  it("parseXlsxQuestions returns SAMPLE_IMPORT_ROW from generated workbook", async () => {
    const XLSX = await import("xlsx");
    const rows = buildSampleImportSheetRows();
    const sheet = XLSX.utils.aoa_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, sheet, "Questions");
    const buffer = XLSX.write(workbook, { type: "array", bookType: "xlsx" });

    const parsed = await parseXlsxQuestions(buffer);
    expect(
      parsed.length,
      `Expected exactly 1 question from sample Excel template, got ${parsed.length}`
    ).toBe(1);

    const row = parsed[0]!;
    for (const col of IMPORT_COLUMN_DEFINITIONS) {
      expect(
        row[col.field],
        `Parsed Excel field "${col.field}" mismatch.\nExpected: ${JSON.stringify(SAMPLE_IMPORT_ROW[col.field])}\nActual:   ${JSON.stringify(row[col.field])}`
      ).toBe(SAMPLE_IMPORT_ROW[col.field]);
    }
  });
});
