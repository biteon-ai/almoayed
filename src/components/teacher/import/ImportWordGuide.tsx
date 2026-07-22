"use client";

import { Button } from "@/components/ui/button";
import { Download, FileText } from "lucide-react";

const TXT_FORMAT = `س: [text]
أ) [option]
ب) [option]
ج) [option]
د) [option]
الجواب: [أ/ب/ج/د]
الشرح: [text]
التصنيف: [text]`;

const DOCX_HINTS = [
  "رقّم كل سؤال بين قوسين مثل (1) ثم (2).",
  "ضع خيارات a–d في جدول أو أسطر واضحة تحت السؤال.",
  "بعد رفع .docx ستظهر تبويبة «معاينة وتعديل» قبل الحفظ.",
] as const;

function downloadSampleWordTxt() {
  const blob = new Blob([TXT_FORMAT], {
    type: "text/plain;charset=utf-8",
  });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = "almoayed-import-template.txt";
  anchor.click();
  URL.revokeObjectURL(url);
}

export function ImportWordGuide() {
  return (
    <div dir="rtl" className="space-y-4 text-start">
      <div className="flex items-start gap-3 rounded-xl border border-amber-100 bg-amber-50/50 p-4 dark:border-amber-900/40 dark:bg-amber-950/20">
        <FileText
          className="mt-0.5 size-5 shrink-0 text-amber-600"
          aria-hidden
        />
        <div className="space-y-2 text-xs leading-relaxed text-amber-900/90 dark:text-amber-100/90">
          <p className="font-bold">Word / Text (.docx / .txt)</p>
          <ul className="list-inside list-disc space-y-1">
            {DOCX_HINTS.map((tip) => (
              <li key={tip}>{tip}</li>
            ))}
          </ul>
        </div>
      </div>

      <pre className="overflow-x-auto rounded-2xl border border-border/70 bg-muted/20 p-4 text-start font-mono text-xs leading-relaxed text-foreground">
        {TXT_FORMAT}
      </pre>

      <Button
        type="button"
        variant="outline"
        className="h-11 gap-2 rounded-xl font-bold"
        onClick={downloadSampleWordTxt}
      >
        <Download className="size-4" />
        تحميل نموذج Word
      </Button>
    </div>
  );
}
