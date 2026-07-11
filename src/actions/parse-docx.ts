"use server";

import { Buffer } from "node:buffer";
import mammoth from "mammoth";
import {
  parseDocxHtmlQuestions,
  sanitizeImportRows,
} from "@/lib/parse-docx-questions";
import type { ImportQuestionRow } from "@/types/database";

/**
 * Converts an uploaded .docx exam file to parsed question rows (server-only;
 * mammoth does not bundle reliably for client dynamic import in Next.js).
 */
export async function parseDocxQuestions(
  formData: FormData
): Promise<ImportQuestionRow[]> {
  const file = formData.get("file");
  if (!file || !(file instanceof File) || file.size === 0) {
    throw new Error("اختار ملف Word (.docx) صالح.");
  }

  const ext = file.name.split(".").pop()?.toLowerCase();
  if (ext !== "docx") {
    throw new Error("الملف لازم يكون بصيغة .docx");
  }

  const arrayBuffer = await file.arrayBuffer();
  const result = await mammoth.convertToHtml({
    buffer: Buffer.from(arrayBuffer),
  });
  const rows = sanitizeImportRows(parseDocxHtmlQuestions(result.value));

  if (!rows.length) {
    throw new Error(
      "ما قدرنا نستخرج أسئلة من ملف Word. تأكد إن كل سؤال يبدأ برقم بين قوسين (1) وجدول خيارات a–d."
    );
  }

  return rows;
}
