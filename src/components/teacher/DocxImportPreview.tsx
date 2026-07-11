"use client";

import type { ImportQuestionRow } from "@/types/database";
import { importRowToOptionsMap } from "@/lib/parse-docx-questions";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CheckCircle2, FileText } from "lucide-react";
import { SPEKIT, spekit } from "@/lib/spekit-targets";

export interface StagedImportRow extends ImportQuestionRow {
  stagingId: string;
}

const CORRECT_OPTIONS = [
  { value: "أ", label: "أ" },
  { value: "ب", label: "ب" },
  { value: "ج", label: "ج" },
  { value: "د", label: "د" },
] as const;

interface DocxImportPreviewProps {
  rows: StagedImportRow[];
  fileName: string;
  onChange: (rows: StagedImportRow[]) => void;
  onConfirm: () => void;
  onCancel: () => void;
  isConfirming: boolean;
}

export function DocxImportPreview({
  rows,
  fileName,
  onChange,
  onConfirm,
  onCancel,
  isConfirming,
}: DocxImportPreviewProps) {
  const updateCorrectAnswer = (stagingId: string, correct_answer: string) => {
    onChange(
      rows.map((row) =>
        row.stagingId === stagingId ? { ...row, correct_answer } : row
      )
    );
  };

  return (
    <div className="space-y-4" {...spekit(SPEKIT.docxImportPreview)}>
      <div className="flex items-start gap-3 rounded-xl border border-brand-200/60 bg-brand-50/40 p-4 text-start dark:border-brand-900/40 dark:bg-brand-950/20">
        <FileText className="mt-0.5 size-5 shrink-0 text-brand-700" />
        <div>
          <p className="text-sm font-bold text-foreground">
            معاينة استيراد Word — {rows.length} سؤال
          </p>
          <p className="mt-1 text-xs text-muted-foreground">{fileName}</p>
          <p className="mt-1 text-xs text-muted-foreground">
            راجع الأسئلة وحدّد الإجابة الصحيحة قبل الحفظ. الافتراضي: أ
          </p>
        </div>
      </div>

      <ul className="max-h-[min(28rem,60vh)] space-y-3 overflow-y-auto pe-1">
        {rows.map((row, index) => {
          const optionsMap = importRowToOptionsMap(row);
          return (
            <li key={row.stagingId}>
              <Card className="border-border/70 shadow-sm">
                <CardContent className="space-y-3 p-4 text-start">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-xs font-bold text-brand-700">
                      سؤال {index + 1}
                    </p>
                    <div className="flex items-center gap-2">
                      <Label
                        htmlFor={`correct-${row.stagingId}`}
                        className="text-xs text-muted-foreground"
                      >
                        الجواب
                      </Label>
                      <Select
                        value={row.correct_answer || "أ"}
                        onValueChange={(value) => {
                          if (value) updateCorrectAnswer(row.stagingId, value);
                        }}
                      >
                        <SelectTrigger
                          id={`correct-${row.stagingId}`}
                          className="h-9 w-[4.5rem] text-xs"
                        >
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {CORRECT_OPTIONS.map((opt) => (
                            <SelectItem key={opt.value} value={opt.value}>
                              {opt.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <p className="text-sm font-medium leading-relaxed">
                    {row.question_text}
                  </p>

                  <dl className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                    {(
                      [
                        ["A", optionsMap.A, "أ"],
                        ["B", optionsMap.B, "ب"],
                        ["C", optionsMap.C, "ج"],
                        ["D", optionsMap.D, "د"],
                      ] as const
                    ).map(([key, value, ar]) =>
                      value ? (
                        <div
                          key={key}
                          className="rounded-lg bg-muted/30 px-3 py-2 text-xs"
                        >
                          <dt className="font-bold text-brand-700">{ar}</dt>
                          <dd className="mt-0.5 font-mono text-foreground/90">
                            {value}
                          </dd>
                        </div>
                      ) : null
                    )}
                  </dl>
                </CardContent>
              </Card>
            </li>
          );
        })}
      </ul>

      <div className="flex flex-col gap-2 sm:flex-row">
        <Button
          type="button"
          variant="brand"
          className="h-11 flex-1 gap-2"
          disabled={isConfirming || rows.length === 0}
          onClick={onConfirm}
          data-spekit={SPEKIT.docxImportConfirm}
        >
          <CheckCircle2 className="size-4" />
          {isConfirming
            ? "جاري الحفظ..."
            : `تأكيد وحفظ ${rows.length} سؤال`}
        </Button>
        <Button
          type="button"
          variant="outline"
          className="h-11"
          disabled={isConfirming}
          onClick={onCancel}
        >
          إلغاء
        </Button>
      </div>
    </div>
  );
}
