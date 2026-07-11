"use client";

import { useRef, useState, useTransition } from "react";
import { importQuestionRows, importQuestions } from "@/actions/teacher";
import { parseDocxQuestions } from "@/actions/parse-docx";
import { DocxImportPreview, type StagedImportRow } from "@/components/teacher/DocxImportPreview";
import { FileUploadZone } from "@/components/teacher/FileUploadZone";
import { Button } from "@/components/ui/button";
import { isDocxFile } from "@/lib/docx-file";
import {
  sanitizeImportRows,
} from "@/lib/parse-docx-questions";
import { Upload, Loader2, SkipForward, FileSearch } from "lucide-react";
import { SPEKIT } from "@/lib/spekit-targets";

interface BulkQuestionUploadProps {
  quizId: string;
  onSuccess: (importedCount: number) => void;
  onSkip?: () => void;
}

type ParsePhase = "idle" | "parsing" | "preview" | "importing";

function toStagedRows(rows: ReturnType<typeof sanitizeImportRows>): StagedImportRow[] {
  return rows.map((row, index) => ({
    ...row,
    stagingId: `stage-${index}-${row.question_text.slice(0, 12)}`,
  }));
}

export function BulkQuestionUpload({
  quizId,
  onSuccess,
  onSkip,
}: BulkQuestionUploadProps) {
  const formRef = useRef<HTMLFormElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [parsePhase, setParsePhase] = useState<ParsePhase>("idle");
  const [stagedRows, setStagedRows] = useState<StagedImportRow[]>([]);
  const [docxFileName, setDocxFileName] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const isBusy = isPending || parsePhase === "parsing" || parsePhase === "importing";

  const resetDocxPreview = () => {
    setStagedRows([]);
    setDocxFileName(null);
    setParsePhase("idle");
  };

  const handleFileSelect = async (file: File) => {
    setError(null);
    resetDocxPreview();

    if (!isDocxFile(file)) {
      return;
    }

    setParsePhase("parsing");
    setDocxFileName(file.name);

    try {
      const formData = new FormData();
      formData.append("file", file);
      const parsed = sanitizeImportRows(await parseDocxQuestions(formData));

      if (!parsed.length) {
        setError(
          "ما قدرنا نستخرج أسئلة من ملف Word. تأكد إن كل سؤال يبدأ برقم بين قوسين (1) وجدول خيارات a–d."
        );
        setParsePhase("idle");
        setDocxFileName(null);
        return;
      }

      setStagedRows(toStagedRows(parsed));
      setParsePhase("preview");
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "فشل قراءة ملف Word. جرّب ملف .docx صالح."
      );
      setParsePhase("idle");
      setDocxFileName(null);
    }
  };

  const handleConfirmDocx = () => {
    setError(null);
    setParsePhase("importing");

    startTransition(async () => {
      try {
        const payload = stagedRows.map(({ stagingId, ...row }) => {
          void stagingId;
          return row;
        });
        const result = await importQuestionRows(quizId, payload);
        resetDocxPreview();
        onSuccess(result.imported);
      } catch (cause) {
        setParsePhase("preview");
        setError(
          cause instanceof Error
            ? cause.message
            : "فشل حفظ الأسئلة. جرّب مرة تانية."
        );
      }
    });
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    if (parsePhase === "preview") {
      return;
    }

    const formData = new FormData(event.currentTarget);
    const file = formData.get("file");
    if (!file || !(file instanceof File) || file.size === 0) {
      setError("اختار ملف CSV أو XLSX أو TXT أو DOCX للاستيراد.");
      return;
    }

    if (isDocxFile(file)) {
      setError("انتظر انتهاء معاينة ملف Word قبل الحفظ.");
      return;
    }

    startTransition(async () => {
      try {
        const result = await importQuestions(quizId, formData);
        onSuccess(result.imported);
      } catch (cause) {
        setError(
          cause instanceof Error
            ? cause.message
            : "فشل استيراد الأسئلة. جرّب مرة تانية."
        );
      }
    });
  };

  if (
    (parsePhase === "preview" || parsePhase === "importing") &&
    stagedRows.length > 0 &&
    docxFileName
  ) {
    return (
      <DocxImportPreview
        rows={stagedRows}
        fileName={docxFileName}
        onChange={setStagedRows}
        onConfirm={handleConfirmDocx}
        onCancel={() => {
          resetDocxPreview();
          if (formRef.current) formRef.current.reset();
        }}
        isConfirming={parsePhase === "importing" || isPending}
      />
    );
  }

  return (
    <form
      ref={formRef}
      onSubmit={handleSubmit}
      className="space-y-4"
      data-spekit={SPEKIT.bulkImportZone}
    >
      <FileUploadZone
        disabled={isBusy}
        onFileSelect={handleFileSelect}
        parsingLabel={
          parsePhase === "parsing"
            ? "جاري قراءة بنية ملف Word..."
            : undefined
        }
      />

      {parsePhase === "parsing" && (
        <p
          role="status"
          className="flex items-center gap-2 rounded-xl border border-brand-200/50 bg-brand-50/30 px-3.5 py-3 text-xs font-semibold text-brand-800"
        >
          <FileSearch className="size-4 animate-pulse" />
          جاري تحليل الجداول والمعادلات في المستند...
        </p>
      )}

      {error && (
        <p
          role="alert"
          className="rounded-xl border border-destructive/25 bg-destructive/5 px-3.5 py-3 text-xs font-semibold text-destructive"
        >
          {error}
        </p>
      )}

      <div className="flex flex-col gap-2 sm:flex-row">
        <Button
          type="submit"
          variant="brand"
          className="h-11 flex-1 gap-2"
          disabled={isBusy}
          data-spekit={SPEKIT.bulkImportSubmit}
        >
          {isPending ? (
            <>
              <Loader2 className="size-4 animate-spin" />
              جاري الاستيراد...
            </>
          ) : (
            <>
              <Upload className="size-4" />
              استيراد الأسئلة
            </>
          )}
        </Button>
        {onSkip && (
          <Button
            type="button"
            variant="outline"
            className="h-11 gap-2"
            disabled={isBusy}
            onClick={onSkip}
          >
            <SkipForward className="size-4" />
            تخطي — إضافة يدوية
          </Button>
        )}
      </div>
    </form>
  );
}

export function ImportSuccessToast({
  importedCount,
  onDismiss,
}: {
  importedCount: number;
  onDismiss: () => void;
}) {
  return (
    <div
      role="status"
      className="fixed inset-x-4 bottom-6 z-50 mx-auto max-w-lg animate-fade-in rounded-xl border border-emerald-200/80 bg-emerald-50 px-4 py-3 shadow-lg dark:border-emerald-900/50 dark:bg-emerald-950/90"
    >
      <div className="flex items-start justify-between gap-3 text-start">
        <p className="text-sm font-bold text-emerald-900 dark:text-emerald-100">
          تم استيراد {importedCount} سؤال بنجاح
        </p>
        <button
          type="button"
          onClick={onDismiss}
          className="shrink-0 text-xs font-semibold text-emerald-700 hover:underline dark:text-emerald-300"
        >
          إغلاق
        </button>
      </div>
      <p className="mt-1 text-xs text-emerald-800/80 dark:text-emerald-200/80">
        راجع قائمة الأسئلة أدناه أو أضف المزيد يدوياً.
      </p>
    </div>
  );
}
