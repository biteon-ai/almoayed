"use client";

import { useEffect, useState } from "react";
import type { AdminTeacherRow } from "@/types/database";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SPEKIT, spekit } from "@/lib/spekit-targets";
import { Loader2 } from "lucide-react";

interface DeleteTeacherDialogProps {
  open: boolean;
  teacher: AdminTeacherRow | null;
  otherTeachers: AdminTeacherRow[];
  onOpenChange: (open: boolean) => void;
  onDeleted: () => void;
}

export function DeleteTeacherDialog({
  open,
  teacher,
  otherTeachers,
  onOpenChange,
  onDeleted,
}: DeleteTeacherDialogProps) {
  const [disposition, setDisposition] = useState<"reassign" | "archive">("archive");
  const [reassignToTeacherId, setReassignToTeacherId] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const hasQuizzes = (teacher?.quizCount ?? 0) > 0;
  const activeOthers = otherTeachers.filter(
    (t) => t.id !== teacher?.id && t.status === "active"
  );

  useEffect(() => {
    if (!open) return;
    setDisposition(activeOthers.length > 0 ? "reassign" : "archive");
    setReassignToTeacherId(activeOthers[0]?.id ?? "");
    setError(null);
  }, [open, activeOthers]);

  async function onConfirm() {
    if (!teacher) return;
    setPending(true);
    setError(null);

    try {
      const res = await fetch(`/api/admin/teachers/${teacher.id}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          confirm: true,
          disposition: hasQuizzes ? disposition : undefined,
          reassignToTeacherId:
            hasQuizzes && disposition === "reassign" ? reassignToTeacherId : undefined,
        }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        setError(data.error ?? "فشل حذف المدرس.");
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
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent dir="rtl" {...spekit(SPEKIT.adminDeleteTeacherDialog)}>
        <DialogHeader>
          <DialogTitle>حذف حساب المدرس</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2 text-sm">
          <p className="leading-relaxed text-muted-foreground">
            سيتم حذف حساب{" "}
            <strong className="text-foreground">{teacher?.fullName}</strong> نهائياً.
            {hasQuizzes
              ? " يوجد اختبارات مرتبطة — اختر مصيرها قبل المتابعة."
              : " لا توجد اختبارات مرتبطة."}
          </p>

          {hasQuizzes ? (
            <div className="space-y-3">
              <Label>مصير الاختبارات</Label>
              <div className="flex flex-col gap-2">
                <label className="flex items-center gap-2 font-semibold">
                  <input
                    type="radio"
                    name="disposition"
                    checked={disposition === "archive"}
                    onChange={() => setDisposition("archive")}
                  />
                  أرشفة الاختبارات (للقراءة فقط)
                </label>
                {activeOthers.length > 0 ? (
                  <label className="flex items-center gap-2 font-semibold">
                    <input
                      type="radio"
                      name="disposition"
                      checked={disposition === "reassign"}
                      onChange={() => setDisposition("reassign")}
                    />
                    نقل الاختبارات إلى مدرس آخر
                  </label>
                ) : null}
              </div>
              {disposition === "reassign" && activeOthers.length > 0 ? (
                <Select
                  value={reassignToTeacherId}
                  onValueChange={(value) => setReassignToTeacherId(value ?? "")}
                >
                  <SelectTrigger className="h-11">
                    <SelectValue placeholder="اختر مدرساً" />
                  </SelectTrigger>
                  <SelectContent>
                    {activeOthers.map((t) => (
                      <SelectItem key={t.id} value={t.id}>
                        {t.fullName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : null}
            </div>
          ) : null}

          {error ? <p className="text-xs font-semibold text-destructive">{error}</p> : null}
        </div>

        <DialogFooter>
          <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
            إلغاء
          </Button>
          <Button type="button" variant="destructive" disabled={pending} onClick={() => void onConfirm()}>
            {pending ? <Loader2 className="size-4 animate-spin" /> : "حذف حساب المدرس"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
