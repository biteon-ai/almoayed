"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  CheckCircle2,
  ClipboardCopy,
  ClipboardPaste,
  Loader2,
  XCircle,
} from "lucide-react";
import { importQuickPasteQuestions } from "@/actions/teacher";
import {
  parseQuickPasteText,
  QUICK_PASTE_SAMPLE_FORMAT,
  type QuickPasteDraft,
} from "@/lib/import-text";
import { SPEKIT } from "@/lib/spekit-targets";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { HubToast } from "@/components/teacher/HubToast";
import { cn } from "@/lib/utils";

interface QuickTextPasteDialogProps {
  quizId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function QuickTextPasteDialog({
  quizId,
  open,
  onOpenChange,
}: QuickTextPasteDialogProps) {
  const router = useRouter();
  const [text, setText] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [toastTone, setToastTone] = useState<"success" | "error">("success");
  const [copyHint, setCopyHint] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const drafts: QuickPasteDraft[] = useMemo(
    () => parseQuickPasteText(text),
    [text]
  );
  const validCount = drafts.filter((d) => d.valid).length;
  const invalidCount = drafts.length - validCount;

  const resetDraft = () => {
    setText("");
    setFormError(null);
    setCopyHint(null);
  };

  const handleOpenChange = (next: boolean) => {
    if (!next && !pending) {
      resetDraft();
    }
    onOpenChange(next);
  };

  const handleCopyExample = async () => {
    try {
      await navigator.clipboard.writeText(QUICK_PASTE_SAMPLE_FORMAT);
      setCopyHint("تم نسخ نموذج التنسيق");
      window.setTimeout(() => setCopyHint(null), 2000);
    } catch {
      setCopyHint("تعذّر النسخ — انسخ من المربع يدوياً");
    }
  };

  const handleSave = () => {
    const trimmed = text.trim();
    if (!trimmed) {
      setFormError("لا يوجد نص");
      return;
    }
    if (validCount === 0) {
      setFormError("ما في أسئلة صالحة للحفظ.");
      return;
    }

    setFormError(null);
    startTransition(async () => {
      try {
        const result = await importQuickPasteQuestions(quizId, text);
        const parts = [`تم استيراد ${result.imported} سؤال`];
        if (result.skippedInvalid > 0) {
          parts.push(`وتخطي ${result.skippedInvalid} غير صالح`);
        }
        if (result.capped) {
          parts.push("(حد أقصى 50 لكل عملية)");
        }
        setToast(parts.join(" — "));
        setToastTone("success");
        resetDraft();
        onOpenChange(false);
        router.refresh();
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "فشل استيراد الأسئلة.";
        setFormError(message);
      }
    });
  };

  return (
    <>
      <Dialog
        open={open}
        onOpenChange={handleOpenChange}
        className="h-[min(92dvh,880px)] w-[min(96vw,72rem)] max-w-6xl"
      >
        <DialogContent
          className="flex h-full max-h-none flex-col gap-0 overflow-hidden p-0"
          dir="rtl"
          data-spekit={SPEKIT.quickTextPasteDialog}
        >
          <DialogHeader className="relative shrink-0 overflow-hidden border-b border-border/60 bg-gradient-to-l from-emerald-50/90 via-background to-background px-5 py-4 text-start sm:px-6 sm:py-5">
            <div
              className="pointer-events-none absolute inset-y-0 start-0 w-1 bg-emerald-600"
              aria-hidden
            />
            <div className="flex items-start gap-3">
              <span className="mt-0.5 flex size-10 shrink-0 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-sm shadow-emerald-600/25">
                <ClipboardPaste className="size-5" aria-hidden />
              </span>
              <div className="min-w-0 space-y-1.5">
                <DialogTitle className="text-xl sm:text-2xl">
                  لصق نصي سريع
                </DialogTitle>
                <DialogDescription className="max-w-3xl text-start text-xs leading-relaxed sm:text-sm">
                  يبدأ كل سؤال بسطر فارغ أو بترقيم{" "}
                  <kbd className="rounded-md border border-border/80 bg-background px-1.5 py-0.5 font-mono text-[11px] font-semibold text-foreground">
                    (1)
                  </kbd>
                  {" · "}
                  <kbd className="rounded-md border border-border/80 bg-background px-1.5 py-0.5 font-mono text-[11px] font-semibold text-foreground">
                    (2)
                  </kbd>
                  . حدّد الجواب بـ{" "}
                  <kbd className="rounded-md border border-border/80 bg-background px-1.5 py-0.5 font-mono text-[11px] font-semibold text-foreground">
                    *ب)
                  </kbd>{" "}
                  أو{" "}
                  <kbd className="rounded-md border border-border/80 bg-background px-1.5 py-0.5 font-mono text-[11px] font-semibold text-foreground">
                    الجواب: ب
                  </kbd>
                  . يُحفظ حتى 50 سؤالاً صالحاً في كل مرة.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="grid min-h-0 flex-1 grid-cols-1 md:grid-cols-2 md:divide-x md:divide-x-reverse md:divide-border/60">
            {/* Paste pane */}
            <section className="flex min-h-0 flex-col gap-3 overflow-hidden p-4 sm:p-5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="text-sm font-bold text-foreground">النص</h3>
                <div className="flex flex-wrap items-center gap-2">
                  {copyHint ? (
                    <span className="text-xs font-medium text-emerald-700">
                      {copyHint}
                    </span>
                  ) : null}
                  <Button
                    type="button"
                    variant="outline"
                    className="h-10 gap-2 rounded-xl text-xs"
                    onClick={handleCopyExample}
                    disabled={pending}
                  >
                    <ClipboardCopy className="size-3.5" />
                    نسخ نموذج التنسيق
                  </Button>
                </div>
              </div>

              <Textarea
                value={text}
                onChange={(e) => {
                  setText(e.target.value);
                  setFormError(null);
                }}
                placeholder={QUICK_PASTE_SAMPLE_FORMAT}
                className="min-h-[220px] flex-1 resize-none rounded-2xl border-border/80 bg-muted/15 p-4 font-mono text-xs leading-relaxed focus-visible:ring-emerald-500/30 sm:min-h-[280px] sm:text-sm md:min-h-0"
                dir="rtl"
                disabled={pending}
                aria-label="نص الأسئلة للصق"
              />

              {formError ? (
                <p
                  role="alert"
                  className="rounded-xl border border-destructive/25 bg-destructive/5 px-3.5 py-2.5 text-xs font-semibold text-destructive"
                >
                  {formError}
                </p>
              ) : null}
            </section>

            {/* Preview pane */}
            <section className="flex min-h-0 flex-col gap-3 overflow-hidden border-t border-border/60 bg-muted/10 p-4 md:border-t-0 sm:p-5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="text-sm font-bold text-foreground">المعاينة</h3>
                <div className="flex flex-wrap items-center gap-1.5 text-[11px] font-semibold">
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-1 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-200">
                    <CheckCircle2 className="size-3" />
                    {validCount} صالح
                  </span>
                  {invalidCount > 0 ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-destructive/10 px-2.5 py-1 text-destructive">
                      <XCircle className="size-3" />
                      {invalidCount} غير صالح
                    </span>
                  ) : null}
                </div>
              </div>

              {drafts.length === 0 ? (
                <div className="flex flex-1 flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-border/80 bg-background/60 px-6 py-10 text-center">
                  <ClipboardPaste
                    className="size-8 text-muted-foreground/50"
                    aria-hidden
                  />
                  <p className="text-sm font-semibold text-foreground">
                    المعاينة تظهر هنا أثناء الكتابة
                  </p>
                  <p className="max-w-xs text-xs leading-relaxed text-muted-foreground">
                    الصق النص أو انسخ النموذج ثم عدّل. الأسئلة الصالحة فقط
                    تُحفظ.
                  </p>
                </div>
              ) : (
                <ul className="min-h-0 flex-1 space-y-2 overflow-y-auto pe-1">
                  {drafts.map((draft) => (
                    <li
                      key={draft.index}
                      className={cn(
                        "rounded-xl border px-3.5 py-3 text-xs shadow-sm transition-colors",
                        draft.valid
                          ? "border-emerald-200/80 bg-background dark:border-emerald-900/40"
                          : "border-destructive/20 bg-destructive/[0.04]"
                      )}
                    >
                      <div className="mb-1.5 flex items-start gap-2">
                        <span
                          className={cn(
                            "mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full",
                            draft.valid
                              ? "bg-emerald-100 text-emerald-700"
                              : "bg-destructive/15 text-destructive"
                          )}
                        >
                          {draft.valid ? (
                            <CheckCircle2 className="size-3.5" />
                          ) : (
                            <XCircle className="size-3.5" />
                          )}
                        </span>
                        <div className="min-w-0 flex-1 space-y-1">
                          <p className="font-bold leading-snug text-foreground">
                            <span className="me-1.5 text-muted-foreground">
                              {draft.index + 1}.
                            </span>
                            {draft.question_text || "(بدون نص سؤال)"}
                          </p>
                          {draft.valid ? (
                            <p className="text-muted-foreground">
                              الجواب{" "}
                              <span className="font-bold text-emerald-700">
                                {draft.correct_letter}
                              </span>
                              {" — "}
                              <span className="font-medium text-foreground">
                                {draft.correct_answer}
                              </span>
                            </p>
                          ) : (
                            <p className="font-semibold text-destructive">
                              {draft.error_reason}
                            </p>
                          )}
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>

          <DialogFooter className="mt-0 shrink-0 flex-row flex-wrap items-center justify-between gap-3 border-t border-border/60 bg-background px-4 py-3 sm:mt-0 sm:px-6 sm:py-4">
            <p className="order-last w-full text-[11px] text-muted-foreground sm:order-first sm:w-auto">
              يُحفظ الصالح فقط · بدون استبدال للأسئلة الحالية
            </p>
            <div className="flex w-full flex-row justify-end gap-2 sm:w-auto">
              <Button
                type="button"
                variant="outline"
                className="h-11 min-w-[5.5rem] rounded-xl"
                onClick={() => handleOpenChange(false)}
                disabled={pending}
              >
                إلغاء
              </Button>
              <Button
                type="button"
                variant="brand"
                className="h-11 min-w-[10rem] gap-2 rounded-xl"
                onClick={handleSave}
                disabled={pending || !text.trim() || validCount === 0}
                data-spekit={SPEKIT.quickTextPasteSubmit}
              >
                {pending ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <CheckCircle2 className="size-4" />
                )}
                حفظ الأسئلة الصالحة
                {validCount > 0 ? ` (${validCount})` : ""}
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <HubToast
        message={toast}
        tone={toastTone}
        onDismiss={() => setToast(null)}
      />
    </>
  );
}
