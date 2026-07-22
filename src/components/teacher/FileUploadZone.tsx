"use client";

import { useRef, useState } from "react";
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
          "flex w-full cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-muted-foreground/25 bg-muted/20 p-8 text-center transition-colors",
          "hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-brand-500/20",
          isDragging && "border-brand-400 bg-brand-50/40",
          disabled && "cursor-not-allowed opacity-50"
        )}
      >
        <div className="mb-4 flex size-14 items-center justify-center rounded-2xl bg-background shadow-sm ring-1 ring-border/60">
          {parsingLabel ? (
            <Loader2 className="size-6 animate-spin text-brand-600" />
          ) : (
            <UploadCloud className="size-6 text-brand-600" />
          )}
        </div>
        <p className="text-sm font-semibold text-foreground">
          {parsingLabel
            ? parsingLabel
            : fileName
              ? fileName
              : "اسحب ملف الأسئلة هنا أو انقر للاختيار"}
        </p>
        <p className="mt-2 max-w-md text-xs leading-relaxed text-muted-foreground">
          يدعم Excel (.xlsx / .csv) و Word (.docx) والنص (.txt)
        </p>
      </button>
      {fileName && !parsingLabel ? (
        <p className="flex items-center justify-center gap-1.5 text-xs font-medium text-brand-700">
          <FileSpreadsheet className="size-3.5" />
          {fileName.endsWith(".docx")
            ? "ملف Word — ستظهر المعاينة في تبويب «معاينة وتعديل»"
            : "تم اختيار الملف — اضغط «رفع واستيراد الأسئلة» للمتابعة"}
        </p>
      ) : null}
    </div>
  );
}
