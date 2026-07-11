"use client";

import { useRef, useState } from "react";
import { FileSpreadsheet, Upload } from "lucide-react";
import { cn } from "@/lib/utils";
import { SPEKIT, spekit } from "@/lib/spekit-targets";

interface FileUploadZoneProps {
  name?: string;
  accept?: string;
  disabled?: boolean;
}

export function FileUploadZone({
  name = "file",
  accept = ".csv,.xlsx,.xls,.txt,.doc,.docx",
  disabled,
}: FileUploadZoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleFile = (file: File | undefined) => {
    if (!file) {
      setFileName(null);
      return;
    }
    setFileName(file.name);
  };

  return (
    <div className="space-y-3" {...spekit(SPEKIT.bulkImportZone)}>
      <input
        ref={inputRef}
        type="file"
        name={name}
        accept={accept}
        disabled={disabled}
        className="sr-only"
        onChange={(event) => handleFile(event.target.files?.[0])}
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
          handleFile(file);
        }}
        className={cn(
          "flex w-full cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-muted bg-muted/20 p-6 text-center transition-colors",
          "hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-brand-500/20",
          isDragging && "border-brand-400 bg-brand-50/30",
          disabled && "cursor-not-allowed opacity-50"
        )}
      >
        <div className="mb-3 flex size-12 items-center justify-center rounded-full bg-background shadow-sm">
          <Upload className="size-5 text-brand-600" />
        </div>
        <p className="text-sm font-semibold text-foreground">
          {fileName ? fileName : "اسحب الملف هنا أو اضغط للاختيار"}
        </p>
        <p className="mt-1.5 max-w-sm text-xs leading-relaxed text-muted-foreground">
          CSV أو XLSX أو TXT — الأعمدة: question_text, option_a-d,
          correct_answer, explanation_text, category_tag
        </p>
      </button>
      {fileName && (
        <p className="flex items-center justify-center gap-1.5 text-xs font-medium text-brand-700">
          <FileSpreadsheet className="size-3.5" />
          تم اختيار الملف — اضغط «استيراد» للمتابعة
        </p>
      )}
    </div>
  );
}
