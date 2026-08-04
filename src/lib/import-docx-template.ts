/**
 * Sample Word (.docx) import template builder (TEACH-012).
 * Canonical framed format (matches teacher exam exports):
 * `(1) س: …` + table cells `أ) value` … + `الجواب:` / `الشرح:` / `التصنيف:`
 */
import { SAMPLE_IMPORT_ROW } from "@/lib/import-template";

export const IMPORT_DOCX_TEMPLATE_FILENAME = "almoayed-import-template.docx";

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

  const doc = new Document({
    sections: [
      {
        children: [
          new Paragraph({
            children: [
              new TextRun({
                text: `(1) س: ${SAMPLE_IMPORT_ROW.question_text}`,
                bold: true,
              }),
            ],
          }),
          new Table({
            width: { size: 9600, type: WidthType.DXA },
            rows: [
              new TableRow({
                children: [
                  cell(`أ) ${SAMPLE_IMPORT_ROW.option_a}`),
                  cell(`ب) ${SAMPLE_IMPORT_ROW.option_b}`),
                  cell(`ج) ${SAMPLE_IMPORT_ROW.option_c}`),
                  cell(`د) ${SAMPLE_IMPORT_ROW.option_d}`),
                ],
              }),
            ],
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: `الجواب: ${SAMPLE_IMPORT_ROW.correct_answer}`,
                bold: true,
              }),
            ],
          }),
          new Paragraph({
            children: [
              new TextRun(`الشرح: ${SAMPLE_IMPORT_ROW.explanation_text}`),
            ],
          }),
          new Paragraph({
            children: [
              new TextRun(`التصنيف: ${SAMPLE_IMPORT_ROW.category_tag}`),
            ],
          }),
        ],
      },
    ],
  });

  const nodeBuffer = await Packer.toBuffer(doc);
  return new Uint8Array(nodeBuffer);
}

/** Client-side download of the official sample Word import template. */
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
