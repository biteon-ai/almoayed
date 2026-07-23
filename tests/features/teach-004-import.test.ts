import { describe, expect, it } from "vitest";
import {
  buildSampleImportSheetRows,
  IMPORT_COLUMN_DEFINITIONS,
} from "@/lib/import-template";
import {
  importRowsToQuestionInserts,
  parseArabicTxtQuiz,
  parseCsvQuestions,
  parseWordLikeText,
  parseXlsxQuestions,
} from "@/lib/import-questions";

const FEATURE = "[TEACH-004]";

describe(`${FEATURE} Bulk question parser`, () => {
  it("parses valid CSV with header aliases", () => {
    const csv = [
      "question_text,option_a,option_b,option_c,option_d,correct_answer,explanation_text,category_tag",
      "سؤال 1,أ,ب,ج,د,ب,شرح,جبر",
    ].join("\n");

    const rows = parseCsvQuestions(csv);
    expect(rows).toHaveLength(1);
    expect(rows[0]?.question_text).toBe("سؤال 1");
    expect(rows[0]?.correct_answer).toBe("ب");
    expect(rows[0]?.category_tag).toBe("جبر");
  });

  it("rejects empty CSV (requires header + at least one row)", () => {
    expect(parseCsvQuestions("question_text\n")).toEqual([]);
    expect(parseCsvQuestions("")).toEqual([]);
  });

  it("parses Arabic block .txt format", () => {
    const txt = [
      "س: ما ناتج 5 × 5؟",
      "أ) 20",
      "ب) 25",
      "ج) 30",
      "د) 35",
      "الجواب: ب",
      "شرح: 5 × 5 = 25",
      "قسم: ضرب",
    ].join("\n");

    const rows = parseWordLikeText(`${txt}\n\n${txt}`);
    expect(rows).toHaveLength(2);
    expect(rows[0]?.correct_answer).toBe("ب");
    expect(rows[0]?.category_tag).toBe("ضرب");
  });

  it("parses canonical الشرح and التصنيف labels in .txt blocks", () => {
    const txt = [
      "س: سؤال تجريبي",
      "أ) 1",
      "ب) 2",
      "ج) 3",
      "د) 4",
      "الجواب: أ",
      "الشرح: هذا شرح",
      "التصنيف: جبر",
    ].join("\n");

    const rows = parseWordLikeText(txt);
    expect(rows).toHaveLength(1);
    expect(rows[0]?.explanation_text).toBe("هذا شرح");
    expect(rows[0]?.category_tag).toBe("جبر");
  });

  it("buildSampleImportSheetRows matches parser column count", () => {
    const [headers] = buildSampleImportSheetRows();
    expect(headers).toHaveLength(IMPORT_COLUMN_DEFINITIONS.length);
    expect(headers[0]).toBe("question_text");
    expect(headers.at(-1)).toBe("category_tag");
  });

  it("parses generated sample import template via parseXlsxQuestions", async () => {
    const XLSX = await import("xlsx");
    const rows = buildSampleImportSheetRows();
    const sheet = XLSX.utils.aoa_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, sheet, "Questions");
    const buffer = XLSX.write(workbook, { type: "array", bookType: "xlsx" });

    const parsed = await parseXlsxQuestions(buffer);
    expect(parsed).toHaveLength(1);
    expect(parsed[0]?.question_text).toBe("ما ناتج 5 × 5؟");
    expect(parsed[0]?.correct_answer).toBe("ب");
    expect(parsed[0]?.category_tag).toBe("ضرب");
  });

  it("skips txt blocks missing question or answer", () => {
    const incomplete = "س: سؤال بدون جواب\nأ) 1\nب) 2";
    expect(parseWordLikeText(incomplete)).toEqual([]);
  });

  it("parses numbered inline MCQ .txt with (a (b (c (d options", () => {
    const txt = [
      "1) ما ناتج 2 + 2؟ (a 3 (b 4 (c 5 (d 6",
      "2) ما ناتج 3 × 3؟ (a 6 (b 9 (c 12 (d 15",
    ].join("\n");

    const rows = parseArabicTxtQuiz(txt);
    expect(rows).toHaveLength(2);
    expect(rows[0]?.question_text).toBe("ما ناتج 2 + 2؟");
    expect(rows[0]?.option_a).toBe("3");
    expect(rows[0]?.option_b).toBe("4");
    expect(rows[0]?.option_c).toBe("5");
    expect(rows[0]?.option_d).toBe("6");
    expect(rows[0]?.correct_answer).toBe("أ");
    expect(rows[1]?.option_b).toBe("9");
  });

  it("parses inline MCQ with Arabic أ) ب) markers and الجواب key", () => {
    const txt =
      "1) اختر الناتج الصحيح أ) 10 ب) 20 ج) 30 د) 40 الجواب: ب";

    const rows = parseArabicTxtQuiz(txt);
    expect(rows).toHaveLength(1);
    expect(rows[0]?.question_text).toContain("اختر الناتج الصحيح");
    expect(rows[0]?.option_b).toBe("20");
    expect(rows[0]?.correct_answer).toBe("ب");
  });

  it("falls back from labeled parser to inline numbered MCQ via parseWordLikeText", () => {
    const txt =
      "1) سؤال تجريبي (a خيار1 (b خيار2 (c خيار3 (d خيار4";
    const rows = parseWordLikeText(txt);
    expect(rows).toHaveLength(1);
    expect(rows[0]?.option_a).toBe("خيار1");
    expect(rows[0]?.option_d).toBe("خيار4");
  });

  it("strips encoding replacement noise before parsing inline MCQ", () => {
    const txt =
      "1) ما قيمة ?? في المعادلة؟ (a 1 (b 2 (c 3 (d 4";
    const rows = parseArabicTxtQuiz(txt);
    expect(rows).toHaveLength(1);
    expect(rows[0]?.question_text).toMatch(/ما قيمة/);
    expect(rows[0]?.question_text).not.toContain("??");
  });

  it("keeps math f(a) inside question text without treating it as an option", () => {
    const txt =
      "1) إذا كان f(a) = 2 فما قيمة a؟ (a 1 (b 2 (c 3 (d 4";
    const rows = parseArabicTxtQuiz(txt);
    expect(rows).toHaveLength(1);
    expect(rows[0]?.question_text).toContain("f(a)");
    expect(rows[0]?.option_a).toBe("1");
  });

  it("parses .xlsx buffer with column aliases", async () => {
    const XLSX = await import("xlsx");
    const sheet = XLSX.utils.aoa_to_sheet([
      ["question_text", "A", "B", "C", "D", "answer", "category"],
      ["سؤال Excel", "1", "2", "3", "4", "2", "هندسة"],
    ]);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, sheet, "Questions");
    const buffer = XLSX.write(workbook, { type: "array", bookType: "xlsx" });

    const rows = await parseXlsxQuestions(buffer);
    expect(rows).toHaveLength(1);
    expect(rows[0]?.option_b).toBe("2");
    expect(rows[0]?.correct_answer).toBe("2");
    expect(rows[0]?.category_tag).toBe("هندسة");
  });

  it("maps import rows to DB insert shape with sort_order", () => {
    const rows = parseCsvQuestions(
      "question_text,option_a,option_b,correct_answer\nQ1,a,b,b"
    );
    const inserts = importRowsToQuestionInserts(rows);
    expect(inserts[0]?.sort_order).toBe(1);
    expect(inserts[0]?.options).toEqual(["a", "b"]);
    expect(inserts[0]?.correct_answer).toBe("b");
  });

  it("assigns sort_order from 1 per import batch (append adds new rows with local ordering)", () => {
    const csvA =
      "question_text,option_a,correct_answer\nQ-batch-a,a,a\nQ-batch-a2,b,b";
    const csvB = "question_text,option_a,correct_answer\nQ-batch-b,c,c";

    const batchA = importRowsToQuestionInserts(parseCsvQuestions(csvA));
    const batchB = importRowsToQuestionInserts(parseCsvQuestions(csvB));

    expect(batchA.map((row) => row.sort_order)).toEqual([1, 2]);
    expect(batchB.map((row) => row.sort_order)).toEqual([1]);
    expect(batchA[0]?.question_text).toBe("Q-batch-a");
    expect(batchB[0]?.question_text).toBe("Q-batch-b");
  });
});
