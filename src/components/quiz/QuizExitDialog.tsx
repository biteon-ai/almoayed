"use client";

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
import { SPEKIT } from "@/lib/spekit-targets";

export function QuizExitDialog({
  open,
  onOpenChange,
  onConfirm,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
}) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent dir="rtl" data-spekit={SPEKIT.quizExitDialog}>
        <AlertDialogHeader>
          <AlertDialogTitle>هل تريد الخروج من الاختبار؟</AlertDialogTitle>
          <AlertDialogDescription>
            سيتم حفظ تقدّمك ويمكنك المتابعة لاحقاً من قائمة الاختبارات.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel className="min-h-11">بقاء</AlertDialogCancel>
          <AlertDialogAction className="min-h-11" onClick={onConfirm}>
            خروج
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
