"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import {
  permanentlyDeleteQuiz,
  restoreQuiz,
} from "@/actions/teacher";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { SPEKIT, spekit } from "@/lib/spekit-targets";
import { Loader2, Trash2 } from "lucide-react";

interface QuizTrashBannerProps {
  quizId: string;
  quizTitle: string;
}

export function QuizTrashBanner({ quizId, quizTitle }: QuizTrashBannerProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [purging, setPurging] = useState(false);

  const handleRestore = () => {
    setError(null);
    startTransition(async () => {
      const result = await restoreQuiz(quizId);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      router.refresh();
    });
  };

  const handlePermanentDelete = () => {
    setError(null);
    setPurging(true);
    startTransition(async () => {
      try {
        const result = await permanentlyDeleteQuiz(quizId);
        if (!result.ok) {
          setError(result.error);
          setConfirmOpen(false);
          return;
        }
        router.push("/teacher/quizzes?view=trash");
        router.refresh();
      } finally {
        setPurging(false);
      }
    });
  };

  return (
    <div
      className="mb-4 rounded-xl border border-amber-500/40 bg-amber-500/10 p-4 text-start"
      dir="rtl"
      {...spekit(SPEKIT.quizTrashBanner)}
    >
      <p className="text-sm font-semibold text-foreground">
        هذا الاختبار في سلة المهملات
      </p>
      <p className="mt-1 text-xs text-muted-foreground">
        «{quizTitle}» مخفي عن الطلاب في قائمة الاختبارات الجديدة. يمكنك
        استعادته أو حذفه نهائياً.
      </p>
      {error && (
        <p role="alert" className="mt-2 text-sm font-medium text-destructive">
          {error}
        </p>
      )}
      <div className="mt-3 flex flex-wrap gap-2">
        <Button
          type="button"
          variant="brand"
          className="h-10 gap-1.5"
          disabled={pending}
          onClick={handleRestore}
          {...spekit(SPEKIT.quizRestoreAction)}
        >
          {pending && !purging ? (
            <Loader2 className="size-4 animate-spin" />
          ) : null}
          استعادة
        </Button>
        <Button
          type="button"
          variant="destructive"
          className="h-10 gap-1.5"
          disabled={pending}
          onClick={() => setConfirmOpen(true)}
          {...spekit(SPEKIT.quizPermanentDeleteAction)}
        >
          <Trash2 className="size-4" />
          حذف نهائي
        </Button>
      </div>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>تأكيد الحذف النهائي</AlertDialogTitle>
            <AlertDialogDescription>
              هل أنت متأكد من حذف هذا الاختبار بشكل نهائي؟ لا يمكن التراجع عن
              هذا الإجراء. سيتم حذف الأسئلة وسجلات النتائج المرتبطة به.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (purging) return;
                handlePermanentDelete();
              }}
              className="inline-flex gap-2 bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {purging ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  جاري الحذف...
                </>
              ) : (
                "حذف نهائي"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
