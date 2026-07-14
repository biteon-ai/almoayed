"use client";

import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { downloadSampleImportXlsx, IMPORT_COLUMN_DEFINITIONS } from "@/lib/import-template";
import { Download, Loader2 } from "lucide-react";

export function ImportExcelGuide() {
  const [pending, startTransition] = useTransition();

  return (
    <div className="space-y-4">
      <div className="overflow-x-auto rounded-xl border border-slate-100">
        <table className="w-full min-w-[520px] text-start text-sm">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50/80">
              <th className="px-4 py-3 font-semibold text-slate-700">Column</th>
              <th className="px-4 py-3 font-semibold text-slate-700">
                Parser field
              </th>
            </tr>
          </thead>
          <tbody>
            {IMPORT_COLUMN_DEFINITIONS.map((col) => (
              <tr
                key={col.field}
                className="border-b border-slate-50 last:border-0"
              >
                <td className="px-4 py-2.5 font-medium text-slate-800">
                  {col.label}
                  {col.hint && (
                    <span className="mt-0.5 block text-xs font-normal text-slate-500">
                      {col.hint}
                    </span>
                  )}
                </td>
                <td className="px-4 py-2.5">
                  <code className="rounded-md bg-slate-100 px-2 py-0.5 text-xs text-slate-600">
                    {col.field}
                  </code>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
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
