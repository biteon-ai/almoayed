"use client";

import type { AdminTeacherRow } from "@/types/database";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Loader2, Power, Trash2 } from "lucide-react";

interface AdminTeacherActionConfirmModalProps {
  action: "delete" | "toggle";
  teacher: AdminTeacherRow;
  pending?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function AdminTeacherActionConfirmModal({
  action,
  teacher,
  pending = false,
  onConfirm,
  onCancel,
}: AdminTeacherActionConfirmModalProps) {
  const isDelete = action === "delete";
  const isDeactivate = teacher.status === "active";

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center p-4"
      dir="rtl"
      role="dialog"
      aria-modal="true"
      aria-labelledby="admin-teacher-confirm-title"
    >
      <button
        type="button"
        className="absolute inset-0 bg-black/50"
        aria-label="إغلاق"
        onClick={onCancel}
      />

      <div
        className={cn(
          "relative w-full max-w-md rounded-2xl border bg-background p-6 shadow-xl",
          isDelete
            ? "border-rose-200 dark:border-rose-900/50"
            : isDeactivate
              ? "border-amber-200 dark:border-amber-900/50"
              : "border-emerald-200 dark:border-emerald-900/50"
        )}
      >
        <div
          className={cn(
            "mb-4 flex size-12 items-center justify-center rounded-full",
            isDelete
              ? "bg-rose-100 text-rose-600 dark:bg-rose-950 dark:text-rose-400"
              : isDeactivate
                ? "bg-amber-100 text-amber-600 dark:bg-amber-950 dark:text-amber-400"
                : "bg-emerald-100 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400"
          )}
        >
          {isDelete ? <Trash2 className="size-6" /> : <Power className="size-6" />}
        </div>

        <h2 id="admin-teacher-confirm-title" className="text-lg font-bold">
          {isDelete ? "حذف حساب المدرس" : "تغيير حالة الحساب"}
        </h2>

        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          {isDelete
            ? "هل أنت تأكد من حذف حساب المدرس؟"
            : "هل أنت تأكد من تغيير حالة حساب المدرس؟"}
        </p>

        <p className="mt-3 text-xs font-semibold text-foreground">
          {teacher.fullName}
          {!isDelete ? (
            <span className="text-muted-foreground">
              {" "}
              — {isDeactivate ? "سيتم تعطيل الحساب" : "سيتم تفعيل الحساب"}
            </span>
          ) : null}
        </p>

        <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-start">
          <Button type="button" variant="ghost" onClick={onCancel} disabled={pending}>
            إلغاء
          </Button>
          <Button
            type="button"
            variant={isDelete ? "destructive" : "default"}
            disabled={pending}
            onClick={onConfirm}
            className={cn(
              !isDelete &&
                isDeactivate &&
                "bg-amber-600 text-white hover:bg-amber-700",
              !isDelete &&
                !isDeactivate &&
                "bg-emerald-600 text-white hover:bg-emerald-700"
            )}
          >
            {pending ? (
              <Loader2 className="size-4 animate-spin" />
            ) : isDelete ? (
              "حذف حساب المدرس"
            ) : (
              "تأكيد التغيير"
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
