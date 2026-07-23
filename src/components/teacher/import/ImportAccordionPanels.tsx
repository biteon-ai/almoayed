"use client";

import { useTransition } from "react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { ImportValidationTips } from "@/components/teacher/import/ImportValidationTips";
import {
  downloadSampleImportXlsx,
  IMPORT_COLUMN_DEFINITIONS,
} from "@/lib/import-template";
import {
  Download,
  FileSpreadsheet,
  FileText,
  HelpCircle,
  Loader2,
  Settings2,
} from "lucide-react";
import { cn } from "@/lib/utils";

const TXT_FORMAT = `س: [text]
أ) [option]
ب) [option]
ج) [option]
د) [option]
الجواب: [أ/ب/ج/د]
الشرح: [text]
التصنيف: [text]`;

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

export type ImportMode = "append" | "replace";

export interface ImportAdvancedSettings {
  defaultMarks: string;
  defaultCategory: string;
  importMode: ImportMode;
}

interface ImportAccordionPanelsProps {
  settings: ImportAdvancedSettings;
  onSettingsChange: (patch: Partial<ImportAdvancedSettings>) => void;
}

export function ImportAccordionPanels({
  settings,
  onSettingsChange,
}: ImportAccordionPanelsProps) {
  const [xlsxPending, startXlsx] = useTransition();

  return (
    <div className="space-y-4" dir="rtl">
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          disabled={xlsxPending}
          onClick={() => {
            startXlsx(async () => {
              await downloadSampleImportXlsx();
            });
          }}
          className={cn(
            "inline-flex h-9 items-center gap-1.5 rounded-full border border-border/80 bg-background px-3.5 text-xs font-bold text-foreground shadow-sm transition-colors",
            "hover:border-emerald-400 hover:bg-emerald-50/50 disabled:opacity-50"
          )}
        >
          {xlsxPending ? (
            <Loader2 className="size-3.5 animate-spin" />
          ) : (
            <FileSpreadsheet className="size-3.5 text-emerald-600" />
          )}
          تحميل نموذج Excel
          <Download className="size-3 opacity-50" />
        </button>
        <button
          type="button"
          onClick={downloadSampleWordTxt}
          className={cn(
            "inline-flex h-9 items-center gap-1.5 rounded-full border border-border/80 bg-background px-3.5 text-xs font-bold text-foreground shadow-sm transition-colors",
            "hover:border-emerald-400 hover:bg-emerald-50/50"
          )}
        >
          <FileText className="size-3.5 text-emerald-600" />
          تحميل نموذج Word
          <Download className="size-3 opacity-50" />
        </button>
      </div>

      <Accordion defaultValue={["rules"]} className="space-y-2">
        <AccordionItem value="rules">
          <AccordionTrigger>
            <HelpCircle
              className="size-4 shrink-0 text-brand-700"
              aria-hidden
            />
            <span>دليل تنسيق الأعمدة</span>
          </AccordionTrigger>
          <AccordionContent>
            <div className="space-y-4 text-start">
              <div className="w-full overflow-hidden rounded-2xl border border-border/70">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/40 hover:bg-muted/40">
                      <TableHead className="w-[28%] text-start font-semibold">
                        اسم العمود
                      </TableHead>
                      <TableHead className="w-[22%] text-start font-semibold">
                        حقل النظام
                      </TableHead>
                      <TableHead className="text-start font-semibold">
                        الوصف والتعليمات
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {IMPORT_COLUMN_DEFINITIONS.map((col) => (
                      <TableRow key={col.field}>
                        <TableCell className="align-top text-sm font-medium text-foreground">
                          {col.label}
                          {col.hint ? (
                            <span className="mt-1 block text-[11px] font-normal text-muted-foreground">
                              {col.hint}
                            </span>
                          ) : null}
                        </TableCell>
                        <TableCell className="align-top">
                          <Badge
                            variant="secondary"
                            className="rounded-md px-2 py-0.5 font-mono text-[11px] font-semibold tracking-tight"
                          >
                            {col.field}
                          </Badge>
                        </TableCell>
                        <TableCell className="align-top text-xs leading-relaxed text-muted-foreground">
                          <span className="font-semibold text-foreground/80">
                            {col.systemLabel}
                          </span>
                          {" — "}
                          {col.description}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              <ImportValidationTips />
            </div>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="advanced">
          <AccordionTrigger>
            <Settings2
              className="size-4 shrink-0 text-brand-700"
              aria-hidden
            />
            <span>إعدادات الاستيراد المتقدمة (اختياري)</span>
          </AccordionTrigger>
          <AccordionContent>
            <div className="space-y-4 text-start">
              <div className="space-y-2">
                <Label htmlFor="import-default-marks">
                  العلامة المحددة لكل سؤال
                </Label>
                <Input
                  id="import-default-marks"
                  name="default_marks"
                  type="number"
                  min={0}
                  step={1}
                  inputMode="numeric"
                  value={settings.defaultMarks}
                  onChange={(e) =>
                    onSettingsChange({ defaultMarks: e.target.value })
                  }
                  placeholder="1"
                  className="h-11 max-w-xs text-sm"
                />
                <p className="text-[11px] text-muted-foreground">
                  للحفظ المستقبلي — لا تُخزَّن العلامة حالياً في قاعدة البيانات.
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="import-default-category">التصنيف / المادة</Label>
                <Input
                  id="import-default-category"
                  name="default_category"
                  value={settings.defaultCategory}
                  onChange={(e) =>
                    onSettingsChange({ defaultCategory: e.target.value })
                  }
                  placeholder="عام"
                  className="h-11 max-w-sm text-sm"
                />
                <p className="text-[11px] text-muted-foreground">
                  يُطبَّق على الأسئلة المستوردة التي بلا تصنيف في الملف.
                </p>
              </div>

              <div className="space-y-2">
                <Label>وضع الاستيراد</Label>
                <input
                  type="hidden"
                  name="import_mode"
                  value={settings.importMode}
                />
                <RadioGroup
                  value={settings.importMode}
                  onValueChange={(value) => {
                    if (value === "append" || value === "replace") {
                      onSettingsChange({ importMode: value });
                    }
                  }}
                  className="grid gap-2 sm:grid-cols-2"
                >
                  <label className="flex cursor-pointer items-start gap-2.5 rounded-xl border border-border/70 bg-muted/15 px-3.5 py-3 text-start text-sm has-[:checked]:border-brand-500 has-[:checked]:bg-brand-50/40">
                    <RadioGroupItem value="append" className="mt-0.5" />
                    <span>
                      <span className="block font-semibold">
                        إضافة إلى الأسئلة الحالية
                      </span>
                      <span className="mt-0.5 block text-xs text-muted-foreground">
                        الإبقاء على الأسئلة الموجودة وإضافة الجديدة — بدون كشف
                        تكرار؛ رفع نفس الملف مرتين يُنشئ نسخاً إضافية.
                      </span>
                    </span>
                  </label>
                  <label className="flex cursor-pointer items-start gap-2.5 rounded-xl border border-border/70 bg-muted/15 px-3.5 py-3 text-start text-sm has-[:checked]:border-brand-500 has-[:checked]:bg-brand-50/40">
                    <RadioGroupItem value="replace" className="mt-0.5" />
                    <span>
                      <span className="block font-semibold">
                        استبدال الأسئلة الحالية
                      </span>
                      <span className="mt-0.5 block text-xs text-muted-foreground">
                        حذف أسئلة الاختبار ثم استيراد الملف.
                      </span>
                    </span>
                  </label>
                </RadioGroup>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
}
