import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  decodeImportTextBuffer,
  parseWordLikeText,
} from "@/lib/import-questions";

const FIXTURE = join(process.cwd(), "tests/fixtures/math-model-1.txt");

describe("Syrian baccalaureate math txt fixture", () => {
  it("decodes CP1256 bytes and imports all numbered questions", () => {
    const buf = readFileSync(FIXTURE);
    const content = decodeImportTextBuffer(
      buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength)
    );

    const rows = parseWordLikeText(content);

    expect(rows.length).toBeGreaterThanOrEqual(11);

    for (const row of rows) {
      const optionCount = [
        row.option_a,
        row.option_b,
        row.option_c,
        row.option_d,
      ].filter((o) => o?.trim()).length;
      expect(optionCount).toBeGreaterThanOrEqual(2);
    }

    expect(rows[0]?.option_a).toBeTruthy();
    expect(rows[0]?.option_b).toBeTruthy();
    expect(rows[0]?.question_text).toMatch(/[\u0600-\u06FF]/);
    expect(rows[9]?.question_text).toBeTruthy();
  });

  it("utf8 mis-decode still finds multiple questions but text is garbled", () => {
    const buf = readFileSync(FIXTURE);
    const utf8 = buf.toString("utf8");
    const rows = parseWordLikeText(utf8);
    expect(rows.length).toBeGreaterThan(1);
  });
});
