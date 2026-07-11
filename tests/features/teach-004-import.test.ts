import { describe, expect, it } from "vitest";
import {
  importRowsToQuestionInserts,
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

  it("skips txt blocks missing question or answer", () => {
    const incomplete = "س: سؤال بدون جواب\nأ) 1\nب) 2";
    expect(parseWordLikeText(incomplete)).toEqual([]);
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
});
