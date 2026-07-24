"use client";

import { useEffect, useState } from "react";
import type { AdminStudentRow } from "@/types/database";
import { Button } from "@/components/ui/button";
import { SPEKIT, spekit } from "@/lib/spekit-targets";
import { cn } from "@/lib/utils";
import { Loader2, Trash2 } from "lucide-react";

type PurgeStep = "warn" | "final";

interface DeleteStudentPurgeDialogProps {
  open: boolean;
  student: AdminStudentRow | null;
  onOpenChange: (open: boolean) => void;
  onDeleted: () => void;
}

export function DeleteStudentPurgeDialog({
  open,
  student,
  onOpenChange,
  onDeleted,
}: DeleteStudentPurgeDialogProps) {
  const [step, setStep] = useState<PurgeStep>("warn");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setStep("warn");
    setPending(false);
    setError(null);
  }, [open, student?.id]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !pending) onOpenChange(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, pending, onOpenChange]);

  if (!open || !student) return null;

  const target = student;
  const linkCount = target.teacherLinkCount;
  const isWarn = step === "warn";

  async function onFinalConfirm() {
    setPending(true);
    setError(null);

    try {
      const res = await fetch(`/api/admin/students/${target.id}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ confirm: true }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        setError(data.error ?? "فشل حذف حساب الطالب.");
        return;
      }
      onOpenChange(false);
      onDeleted();
    } catch {
      setError("تعذر الاتصال بالخادم.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center p-4"
      dir="rtl"
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="admin-student-purge-title"
      {...spekit(SPEKIT.adminStudentPurgeAction)}
    >
      <button
        type="button"
        className="absolute inset-0 bg-black/50"
        aria-label="إغلاق"
        disabled={pending}
        onClick={() => {
          if (!pending) onOpenChange(false);
        }}
      />

      <div
        className={cn(
          "relative w-full max-w-md rounded-2xl border bg-background p-6 shadow-xl",
          "border-rose-200 dark:border-rose-900/50"
        )}
      >
        <div className="mb-4 flex size-12 items-center justify-center rounded-full bg-rose-100 text-rose-600 dark:bg-rose-950 dark:text-rose-400">
          <Trash2 className="size-6" />
        </div>

        <h2 id="admin-student-purge-title" className="text-lg font-bold">
          {isWarn ? "تحذير: حذف نهائي للطالب" : "تأكيد الحذف النهائي"}
        </h2>

        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          {isWarn ? (
            <>
              سيتم حذف حساب{" "}
              <strong className="text-foreground">{target.fullName}</strong>{" "}
              نهائياً مع كل بياناته المرتبطة. لا يمكن التراجع.
            </>
          ) : (
            <>
              لا يمكن التراجع عن هذه العملية. هل أنت متأكد من حذف حساب{" "}
              <strong className="text-foreground">{target.fullName}</strong>{" "}
              نهائياً؟
            </>
          )}
        </p>

        {isWarn ? (
          <p className="mt-3 text-sm font-bold text-foreground">
            مرتبط بـ {linkCount} مدرسين
          </p>
        ) : null}

        {error ? (
          <p className="mt-3 text-xs font-semibold text-destructive">{error}</p>
        ) : null}

        <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-start">
          <Button
            type="button"
            variant="ghost"
            className="h-11"
            disabled={pending}
            onClick={() => onOpenChange(false)}
          >
            إلغاء
          </Button>
          {isWarn ? (
            <Button
              type="button"
              variant="destructive"
              className="h-11"
              onClick={() => setStep("final")}
            >
              متابعة
            </Button>
          ) : (
            <Button
              type="button"
              variant="destructive"
              className="h-11"
              disabled={pending}
              onClick={() => void onFinalConfirm()}
            >
              {pending ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                "حذف نهائي"
              )}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
