"use client";

import { useRef, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { FileSpreadsheet, UploadCloud, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { SPEKIT, spekit } from "@/lib/spekit-targets";

interface FileUploadZoneProps {
  name?: string;
  accept?: string;
  disabled?: boolean;
  onFileSelect?: (file: File) => void | Promise<void>;
  parsingLabel?: string;
}

export function FileUploadZone({
  name = "file",
  accept = ".csv,.xlsx,.xls,.txt,.docx",
  disabled,
  onFileSelect,
  parsingLabel,
}: FileUploadZoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const applyFile = async (file: File | undefined) => {
    if (!file) {
      setFileName(null);
      return;
    }
    setFileName(file.name);
    await onFileSelect?.(file);
  };

  return (
    <div className="space-y-3" dir="rtl" {...spekit(SPEKIT.bulkImportZone)}>
      <input
        ref={inputRef}
        type="file"
        name={name}
        accept={accept}
        disabled={disabled}
        className="sr-only"
        onChange={(event) => void applyFile(event.target.files?.[0])}
      />
      <button
        type="button"
        disabled={disabled}
        onClick={() => inputRef.current?.click()}
        onDragOver={(event) => {
          event.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(event) => {
          event.preventDefault();
          setIsDragging(false);
          const file = event.dataTransfer.files?.[0];
          if (!file || !inputRef.current) return;
          const dataTransfer = new DataTransfer();
          dataTransfer.items.add(file);
          inputRef.current.files = dataTransfer.files;
          void applyFile(file);
        }}
        className={cn(
          "flex w-full cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-primary/20 bg-muted/10 p-10 text-center transition-all",
          "hover:border-emerald-500 hover:bg-emerald-50/30 focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-brand-500/20",
          isDragging && "border-emerald-500 bg-emerald-50/40",
          disabled && "cursor-not-allowed opacity-50"
        )}
      >
        <div className="mb-4 flex size-16 items-center justify-center rounded-2xl bg-background shadow-sm ring-1 ring-border/60">
          {parsingLabel ? (
            <Loader2 className="size-8 animate-spin text-emerald-600" />
          ) : (
            <UploadCloud className="size-8 text-emerald-600" />
          )}
        </div>
        <p className="text-sm font-semibold text-foreground sm:text-base">
          {parsingLabel
            ? parsingLabel
            : fileName
              ? fileName
              : "اسحب وأسقط ملف الأسئلة هنا، أو انقر للاختيار"}
        </p>
        {!parsingLabel && !fileName ? (
          <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
            <Badge
              variant="secondary"
              className="rounded-full px-2.5 py-0.5 text-[11px] font-semibold"
            >
              Excel (.xlsx)
            </Badge>
            <Badge
              variant="secondary"
              className="rounded-full px-2.5 py-0.5 text-[11px] font-semibold"
            >
              Word (.docx)
            </Badge>
            <Badge
              variant="secondary"
              className="rounded-full px-2.5 py-0.5 text-[11px] font-semibold"
            >
              CSV
            </Badge>
          </div>
        ) : null}
      </button>
      {fileName && !parsingLabel ? (
        <p className="flex items-center justify-center gap-1.5 text-xs font-medium text-brand-700">
          <FileSpreadsheet className="size-3.5" />
          {fileName.endsWith(".docx")
            ? "ملف Word — ستظهر المعاينة أسفل منطقة الرفع بعد التحليل"
            : "تم اختيار الملف — اضغط «رفع واستيراد الأسئلة» للمتابعة"}
        </p>
      ) : null}
    </div>
  );
}
