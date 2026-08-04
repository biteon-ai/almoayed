/**
 * Sample Word (.docx) import template builder (TEACH-012).
 * Canonical framed format matching teacher exam exports such as
 * «اسئلة_رياضيات_مؤطرة»:
 * `(1) س: …` + table `أ) … | ب) …` + `الجواب:` / `الشرح:` / `التصنيف:`
 */
import { SAMPLE_IMPORT_ROW } from "@/lib/import-template";

export const IMPORT_DOCX_TEMPLATE_FILENAME = "almoayed-import-template.docx";

type FramedSampleQuestion = {
  stem: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  correct_answer: string;
  explanation_text: string;
  category_tag: string;
};

/** Two illustrative MCQs so teachers see numbering + جواب/شرح/تصنيف pattern. */
export const SAMPLE_DOCX_QUESTIONS: FramedSampleQuestion[] = [
  {
    stem: SAMPLE_IMPORT_ROW.question_text,
    option_a: SAMPLE_IMPORT_ROW.option_a,
    option_b: SAMPLE_IMPORT_ROW.option_b,
    option_c: SAMPLE_IMPORT_ROW.option_c,
    option_d: SAMPLE_IMPORT_ROW.option_d,
    correct_answer: SAMPLE_IMPORT_ROW.correct_answer,
    explanation_text: SAMPLE_IMPORT_ROW.explanation_text,
    category_tag: SAMPLE_IMPORT_ROW.category_tag,
  },
  {
    stem: "إذا كانت الدالة f(x) = x² - 4x + 3، فما هي القيمة الصغرى للدالة؟",
    option_a: "1",
    option_b: "-1",
    option_c: "2",
    option_d: "0",
    correct_answer: "ب",
    explanation_text:
      "القيمة الصغرى للدالة التربيعية تقع عند الرأس x = -b/(2a). هنا x = 2 و f(2) = -1.",
    category_tag: "الجبر - الدوال التربيعية",
  },
];

/** Builds OOXML bytes for the official sample Word import template. */
export async function buildSampleImportDocxBuffer(): Promise<Uint8Array> {
  const {
    Document,
    Packer,
    Paragraph,
    Table,
    TableRow,
    TableCell,
    TextRun,
    WidthType,
    BorderStyle,
  } = await import("docx");

  const border = { style: BorderStyle.SINGLE, size: 1, color: "000000" };
  const borders = { top: border, bottom: border, left: border, right: border };

  const cell = (text: string) =>
    new TableCell({
      borders,
      width: { size: 2200, type: WidthType.DXA },
      children: [new Paragraph({ children: [new TextRun(text)] })],
    });

  const children = SAMPLE_DOCX_QUESTIONS.flatMap((q, index) => [
    new Paragraph({
      children: [
        new TextRun({
          text: `(${index + 1}) س: ${q.stem}`,
          bold: true,
        }),
      ],
    }),
    new Table({
      width: { size: 9600, type: WidthType.DXA },
      rows: [
        new TableRow({
          children: [
            cell(`أ) ${q.option_a}`),
            cell(`ب) ${q.option_b}`),
            cell(`ج) ${q.option_c}`),
            cell(`د) ${q.option_d}`),
          ],
        }),
      ],
    }),
    new Paragraph({
      children: [
        new TextRun({
          text: `الجواب: ${q.correct_answer}`,
          bold: true,
        }),
      ],
    }),
    new Paragraph({
      children: [new TextRun(`الشرح: ${q.explanation_text}`)],
    }),
    new Paragraph({
      children: [new TextRun(`التصنيف: ${q.category_tag}`)],
    }),
  ]);

  const doc = new Document({
    sections: [{ children }],
  });

  const nodeBuffer = await Packer.toBuffer(doc);
  return new Uint8Array(nodeBuffer);
}

/** Client-side download of the official sample Word import template (.docx). */
export async function downloadSampleImportDocx(): Promise<void> {
  const bytes = await buildSampleImportDocxBuffer();
  const copy = new Uint8Array(bytes.byteLength);
  copy.set(bytes);
  const blob = new Blob([copy], {
    type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = IMPORT_DOCX_TEMPLATE_FILENAME;
  anchor.click();
  URL.revokeObjectURL(url);
}
