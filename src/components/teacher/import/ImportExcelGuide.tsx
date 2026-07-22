"use client";

import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  downloadSampleImportXlsx,
  IMPORT_COLUMN_DEFINITIONS,
} from "@/lib/import-template";
import { Download, FileSpreadsheet, Loader2 } from "lucide-react";

export function ImportExcelGuide() {
  const [pending, startTransition] = useTransition();

  return (
    <div dir="rtl" className="space-y-4 text-start">
      <div className="flex items-start gap-3 rounded-xl border border-border/70 bg-muted/20 p-4">
        <FileSpreadsheet className="mt-0.5 size-5 shrink-0 text-brand-700" aria-hidden />
        <div className="space-y-1 text-xs leading-relaxed text-muted-foreground">
          <p className="font-bold text-foreground">Excel / CSV</p>
          <p>
            الصف الأول = أسماء الحقول الإنجليزية أدناه. الصف الثاني وما بعده =
            الأسئلة. يمكنك تنزيل النموذج الجاهز كنقطة بداية.
          </p>
        </div>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-border/70">
        <Table className="min-w-[640px]">
          <TableHeader>
            <TableRow className="bg-muted/40 hover:bg-muted/40">
              <TableHead className="text-start font-semibold text-foreground">
                حقل النظام
              </TableHead>
              <TableHead className="text-start font-semibold text-foreground">
                اسم العمود المطلوب
              </TableHead>
              <TableHead className="text-start font-semibold text-foreground">
                الوصف والتعليمات
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {IMPORT_COLUMN_DEFINITIONS.map((col) => (
              <TableRow key={col.field}>
                <TableCell className="font-medium text-foreground">
                  {col.systemLabel}
                </TableCell>
                <TableCell>
                  <code className="rounded-md bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                    {col.field}
                  </code>
                  {col.hint ? (
                    <span className="mt-1 block text-[11px] text-muted-foreground">
                      {col.hint}
                    </span>
                  ) : null}
                </TableCell>
                <TableCell className="text-xs leading-relaxed text-muted-foreground">
                  {col.description}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Button
        type="button"
        variant="outline"
        className="h-11 gap-2 rounded-xl font-bold"
        disabled={pending}
        onClick={() => {
          startTransition(async () => {
            await downloadSampleImportXlsx();
          });
        }}
      >
        {pending ? (
          <Loader2 className="size-4 animate-spin" />
        ) : (
          <Download className="size-4" />
        )}
        تحميل نموذج Excel
      </Button>
    </div>
  );
}
