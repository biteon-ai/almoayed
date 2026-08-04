import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import mammoth from "mammoth";
import {
  parseDocxHtmlQuestions,
  sanitizeImportRows,
} from "@/lib/parse-docx-questions";

const FEATURE = "[TEACH-012]";
const FORMAL_DOCX = path.join(
  process.env.HOME ?? "",
  "Downloads",
  "اسئلة_رياضيات_مؤطرة (1).docx"
);

describe(`${FEATURE} formal framed DOCX file`, () => {
  it.skipIf(!fs.existsSync(FORMAL_DOCX))(
    "imports اسئلة_رياضيات_مؤطرة without أ) prefix and with الجواب keys",
    async () => {
      const buffer = fs.readFileSync(FORMAL_DOCX);
      const { value: html } = await mammoth.convertToHtml({ buffer });
      const rows = sanitizeImportRows(parseDocxHtmlQuestions(html));

      expect(rows.length).toBe(10);
      expect(rows[0]?.option_a).toBe("1");
      expect(rows[0]?.option_a).not.toMatch(/أ/);
      expect(rows[0]?.option_b).toBe("-1");
      expect(rows[0]?.correct_answer).toBe("ب");
      expect(rows[0]?.explanation_text.length).toBeGreaterThan(10);
      expect(rows[0]?.category_tag).toContain("الجبر");

      expect(rows[1]?.correct_answer).toBe("ج");
      expect(rows[1]?.option_c).toBe("5");

      expect(rows[3]?.correct_answer).toBe("أ");
      expect(rows[7]?.correct_answer).toBe("ب");

      for (const row of rows) {
        expect(row.option_a).not.toMatch(/^أ/);
        expect(row.option_b).not.toMatch(/^ب/);
        expect(["أ", "ب", "ج", "د"]).toContain(row.correct_answer);
      }
    }
  );
});
