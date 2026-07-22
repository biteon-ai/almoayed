import type { ImportQuestionRow } from "@/types/database";

export type ImportColumnField = keyof ImportQuestionRow;

export interface ImportColumnDefinition {
  label: string;
  field: ImportColumnField;
  systemLabel: string;
  description: string;
  hint?: string;
}

export const IMPORT_COLUMN_DEFINITIONS: ImportColumnDefinition[] = [
  {
    label: "Question Text",
    field: "question_text",
    systemLabel: "نص السؤال",
    description: "نص السؤال كاملاً (عمود إلزامي).",
  },
  {
    label: "Option A",
    field: "option_a",
    systemLabel: "الخيار أ",
    description: "نص الخيار الأول.",
  },
  {
    label: "Option B",
    field: "option_b",
    systemLabel: "الخيار ب",
    description: "نص الخيار الثاني.",
  },
  {
    label: "Option C",
    field: "option_c",
    systemLabel: "الخيار ج",
    description: "نص الخيار الثالث.",
  },
  {
    label: "Option D",
    field: "option_d",
    systemLabel: "الخيار د",
    description: "نص الخيار الرابع.",
  },
  {
    label: "Correct Option (A, B, C, or D)",
    field: "correct_answer",
    systemLabel: "الإجابة الصحيحة",
    hint: "أ / ب / ج / د",
    description: "حرف الخيار الصحيح: أ أو ب أو ج أو د.",
  },
  {
    label: "Explanation",
    field: "explanation_text",
    systemLabel: "الشرح",
    description: "شرح يظهر للطالب بعد التسليم (اختياري).",
  },
  {
    label: "Category",
    field: "category_tag",
    systemLabel: "التصنيف",
    description: "وسم موضوعي للمراجعة والفلترة (اختياري).",
  },
];

export const SAMPLE_IMPORT_ROW: ImportQuestionRow = {
  question_text: "ما ناتج 5 × 5؟",
  option_a: "20",
  option_b: "25",
  option_c: "30",
  option_d: "35",
  correct_answer: "ب",
  explanation_text: "5 × 5 = 25",
  category_tag: "ضرب",
};

export const IMPORT_TEMPLATE_FILENAME = "almoayed-import-template.xlsx";
export const IMPORT_TEMPLATE_SHEET_NAME = "Questions";

/** Row 1 = parser headers; row 2 = sample Arabic MCQ. */
export function buildSampleImportSheetRows(): string[][] {
  const headers = IMPORT_COLUMN_DEFINITIONS.map((col) => col.field);
  const sample = IMPORT_COLUMN_DEFINITIONS.map(
    (col) => SAMPLE_IMPORT_ROW[col.field]
  );
  return [headers, sample];
}

export async function downloadSampleImportXlsx(): Promise<void> {
  const XLSX = await import("xlsx");
  const rows = buildSampleImportSheetRows();
  const sheet = XLSX.utils.aoa_to_sheet(rows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, sheet, IMPORT_TEMPLATE_SHEET_NAME);
  const buffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
  const blob = new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = IMPORT_TEMPLATE_FILENAME;
  anchor.click();
  URL.revokeObjectURL(url);
}
