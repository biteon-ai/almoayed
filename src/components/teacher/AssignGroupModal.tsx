"use client";

import { useCallback, useEffect, useState, useTransition } from "react";
import {
  getQuizGroupAssignmentModalData,
  updateQuizGroupAssignments,
  type QuizGroupAssignmentModalData,
} from "@/actions/teacher";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { SPEKIT, spekit } from "@/lib/spekit-targets";
import { cn } from "@/lib/utils";
import { Loader2, Users } from "lucide-react";

interface AssignGroupModalProps {
  quizId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: (message: string) => void;
  onError: (message: string) => void;
  onSaved?: (
    quizId: string,
    groups: Array<{ id: string; name: string }>
  ) => void;
}

export function AssignGroupModal({
  quizId,
  open,
  onOpenChange,
  onSuccess,
  onError,
  onSaved,
}: AssignGroupModalProps) {
  const [data, setData] = useState<QuizGroupAssignmentModalData | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [pending, startTransition] = useTransition();

  const loadData = useCallback(async () => {
    if (!quizId) return;
    setLoading(true);
    try {
      const result = await getQuizGroupAssignmentModalData(quizId);
      if (!result) {
        onError("الاختبار غير موجود.");
        onOpenChange(false);
        return;
      }
      setData(result);
      setSelectedIds(result.assignedGroupIds);
    } catch {
      onError("فشل تحميل المجموعات.");
      onOpenChange(false);
    } finally {
      setLoading(false);
    }
  }, [onError, onOpenChange, quizId]);

  useEffect(() => {
    if (open && quizId) {
      void loadData();
    } else if (!open) {
      setData(null);
      setSelectedIds([]);
    }
  }, [loadData, open, quizId]);

  const toggleGroup = (groupId: string, checked: boolean) => {
    setSelectedIds((prev) =>
      checked ? [...prev, groupId] : prev.filter((id) => id !== groupId)
    );
  };

  const handleSave = () => {
    if (!quizId) return;

    startTransition(async () => {
      const result = await updateQuizGroupAssignments(quizId, selectedIds);
      if (!result.ok) {
        onError(result.error);
        return;
      }
      onSaved?.(
        quizId,
        selectedIds
          .map((id) => {
            const group = data?.groups.find((g) => g.id === id);
            return group
              ? { id: group.id, name: group.group_name }
              : null;
          })
          .filter((g): g is { id: string; name: string } => g !== null)
      );
      onSuccess("تم حفظ تعيين المجموعات بنجاح.");
      onOpenChange(false);
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-w-md"
        dir="rtl"
        {...spekit(SPEKIT.assignGroupModal)}
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="size-5 text-brand-600" aria-hidden />
            تعيين المجموعات
          </DialogTitle>
          <DialogDescription className="text-start">
            {data?.quizTitle
              ? `اختر المجموعات التي يمكن لطلابها الوصول إلى «${data.quizTitle}».`
              : "جاري التحميل..."}
          </DialogDescription>
        </DialogHeader>

        <div className="max-h-[min(50vh,20rem)] space-y-2 overflow-y-auto py-1">
          {loading ? (
            <div className="flex items-center justify-center gap-2 py-8 text-sm text-muted-foreground">
              <Loader2 className="size-4 animate-spin" />
              جاري تحميل المجموعات...
            </div>
          ) : data?.groups.length ? (
            data.groups.map((group) => {
              const checked = selectedIds.includes(group.id);
              return (
                <label
                  key={group.id}
                  htmlFor={`assign-group-${group.id}`}
                  className={cn(
                    "flex cursor-pointer items-center gap-3 rounded-xl border px-3 py-2.5 transition-colors",
                    checked
                      ? "border-emerald-500/50 bg-emerald-50/60 dark:bg-emerald-950/20"
                      : "border-border bg-muted/20 hover:bg-muted/40"
                  )}
                >
                  <Checkbox
                    id={`assign-group-${group.id}`}
                    checked={checked}
                    onCheckedChange={(value) =>
                      toggleGroup(group.id, value === true)
                    }
                  />
                  <span className="min-w-0 flex-1 text-start text-sm font-medium">
                    {group.group_name}
                  </span>
                </label>
              );
            })
          ) : (
            <p className="rounded-xl border border-dashed border-border bg-muted/20 px-4 py-6 text-center text-sm text-muted-foreground">
              لا توجد مجموعات بعد. أنشئ مجموعة من صفحة الطلاب أولاً.
            </p>
          )}
        </div>

        {!loading && data?.groups.length ? (
          <p className="text-[11px] text-muted-foreground">
            {selectedIds.length === 0
              ? "بدون تحديد: الاختبار يصبح «عادي» ومتاحاً لكل الطلاب."
              : `محدد ${selectedIds.length} ${selectedIds.length === 1 ? "مجموعة" : "مجموعات"}.`}
          </p>
        ) : null}

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={pending}
          >
            إلغاء
          </Button>
          <Button
            type="button"
            variant="brand"
            className="gap-2"
            disabled={pending || loading || !quizId}
            onClick={handleSave}
            {...spekit(SPEKIT.assignGroupSave)}
          >
            {pending ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                جاري الحفظ...
              </>
            ) : (
              "حفظ التعيين"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
