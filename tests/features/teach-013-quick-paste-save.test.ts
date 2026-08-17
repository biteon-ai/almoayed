import { describe, expect, it } from "vitest";
import {
  parseQuickPasteText,
  toImportRowsFromValidDrafts,
  QUICK_PASTE_MAX_IMPORT,
} from "@/lib/import-text";
import { importRowsToQuestionInserts } from "@/lib/import-questions";

const FEATURE = "[TEACH-013]";

describe(`${FEATURE} quick paste save shape`, () => {
  it("maps valid subset and counts skipped invalids", () => {
    const text = `س: واحد؟
أ) a
*ب) b

س: باطل؟
أ) فقط`;

    const drafts = parseQuickPasteText(text);
    const result = toImportRowsFromValidDrafts(drafts);
    expect(result.imported).toBe(1);
    expect(result.skippedInvalid).toBe(1);
    expect(result.capped).toBe(false);
    expect(result.rows[0]?.correct_answer).toBe("b");
  });

  it("caps at 50 valid questions", () => {
    const blocks = Array.from({ length: QUICK_PASTE_MAX_IMPORT + 5 }, (_, i) => {
      return `س: سؤال ${i + 1}؟
أ) خطأ
*ب) صح ${i + 1}`;
    }).join("\n\n");

    const drafts = parseQuickPasteText(blocks);
    const result = toImportRowsFromValidDrafts(drafts);
    expect(result.imported).toBe(QUICK_PASTE_MAX_IMPORT);
    expect(result.capped).toBe(true);
    expect(result.skippedInvalid).toBe(0);
  });

  it("persists correct_answer as option text for * and الجواب forms", () => {
    const text = `س: نجمة؟
أ) واحد
*ب) اثنان
ج) ثلاثة

س: جواب صريح؟
أ) أحمر
ب) أزرق
الجواب: ب
ج) أخضر`;

    const drafts = parseQuickPasteText(text);
    const { rows } = toImportRowsFromValidDrafts(drafts);
    expect(rows).toHaveLength(2);
    expect(rows[0]?.correct_answer).toBe("اثنان");
    expect(rows[1]?.correct_answer).toBe("أزرق");

    const inserts = importRowsToQuestionInserts(rows);
    expect(inserts[0]?.correct_answer).toBe("اثنان");
    expect(inserts[0]?.options).toEqual(["واحد", "اثنان", "ثلاثة"]);
    expect(inserts[1]?.options).toEqual(["أحمر", "أزرق", "أخضر"]);
    expect(inserts[1]?.correct_answer).toBe("أزرق");
  });
});
