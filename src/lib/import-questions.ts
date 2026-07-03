import { randomBytes } from "crypto";
import type { ImportQuestionRow } from "@/types/database";

export function generateSessionToken(): string {
  return randomBytes(32).toString("hex");
}

export function parseCsvQuestions(content: string): ImportQuestionRow[] {
  const lines = content
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);

  if (lines.length < 2) return [];

  const headers = lines[0].split(",").map((h) => h.trim().toLowerCase());
  const rows: ImportQuestionRow[] = [];

  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(",").map((c) => c.trim());
    const row: Record<string, string> = {};
    headers.forEach((h, idx) => {
      row[h] = cols[idx] ?? "";
    });

    if (!row.question_text) continue;

    rows.push({
      question_text: row.question_text,
      option_a: row.option_a ?? row.a ?? "",
      option_b: row.option_b ?? row.b ?? "",
      option_c: row.option_c ?? row.c ?? "",
      option_d: row.option_d ?? row.d ?? "",
      correct_answer: row.correct_answer ?? row.answer ?? "",
      explanation_text: row.explanation_text ?? row.explanation ?? "",
      category_tag: row.category_tag ?? row.category ?? "عام",
    });
  }

  return rows;
}

export async function parseXlsxQuestions(buffer: ArrayBuffer): Promise<ImportQuestionRow[]> {
  const XLSX = await import("xlsx");
  const workbook = XLSX.read(buffer, { type: "array" });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const json = XLSX.utils.sheet_to_json<Record<string, string>>(sheet, {
    defval: "",
  });

  return json
    .filter((r) => r.question_text?.trim())
    .map((r) => ({
      question_text: String(r.question_text ?? "").trim(),
      option_a: String(r.option_a ?? r.A ?? "").trim(),
      option_b: String(r.option_b ?? r.B ?? "").trim(),
      option_c: String(r.option_c ?? r.C ?? "").trim(),
      option_d: String(r.option_d ?? r.D ?? "").trim(),
      correct_answer: String(r.correct_answer ?? r.answer ?? "").trim(),
      explanation_text: String(r.explanation_text ?? r.explanation ?? "").trim(),
      category_tag: String(r.category_tag ?? r.category ?? "عام").trim(),
    }));
}

export function parseWordLikeText(content: string): ImportQuestionRow[] {
  const blocks = content.split(/\n\s*\n/).filter(Boolean);
  const rows: ImportQuestionRow[] = [];

  for (const block of blocks) {
    const lines = block.split(/\n/).map((l) => l.trim()).filter(Boolean);
    if (!lines.length) continue;

    const row: ImportQuestionRow = {
      question_text: "",
      option_a: "",
      option_b: "",
      option_c: "",
      option_d: "",
      correct_answer: "",
      explanation_text: "",
      category_tag: "عام",
    };

    for (const line of lines) {
      if (line.startsWith("س:") || line.startsWith("Q:")) {
        row.question_text = line.replace(/^(س:|Q:)\s*/, "");
      } else if (/^[أإaA][\).:-]/.test(line)) {
        row.option_a = line.replace(/^[أإaA][\).:-]\s*/, "");
      } else if (/^[بbB][\).:-]/.test(line)) {
        row.option_b = line.replace(/^[بbB][\).:-]\s*/, "");
      } else if (/^[جcC][\).:-]/.test(line)) {
        row.option_c = line.replace(/^[جcC][\).:-]\s*/, "");
      } else if (/^[دdD][\).:-]/.test(line)) {
        row.option_d = line.replace(/^[دdD][\).:-]\s*/, "");
      } else if (line.startsWith("الجواب:") || line.startsWith("Answer:")) {
        row.correct_answer = line.replace(/^(الجواب:|Answer:)\s*/, "");
      } else if (line.startsWith("شرح:") || line.startsWith("Explanation:")) {
        row.explanation_text = line.replace(/^(شرح:|Explanation:)\s*/, "");
      } else if (line.startsWith("قسم:") || line.startsWith("Category:")) {
        row.category_tag = line.replace(/^(قسم:|Category:)\s*/, "");
      } else if (!row.question_text) {
        row.question_text = line;
      }
    }

    if (row.question_text && row.correct_answer) rows.push(row);
  }

  return rows;
}

export function importRowsToQuestionInserts(rows: ImportQuestionRow[]) {
  return rows.map((r, idx) => {
    const options = [r.option_a, r.option_b, r.option_c, r.option_d].filter(
      Boolean
    );
    return {
      question_text: r.question_text,
      options,
      correct_answer: r.correct_answer,
      explanation_text: r.explanation_text || "",
      category_tag: r.category_tag || "عام",
      sort_order: idx + 1,
    };
  });
}
