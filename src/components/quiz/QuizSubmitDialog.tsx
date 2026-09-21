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

export function QuizSubmitDialog({
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
      <AlertDialogContent dir="rtl" data-spekit={SPEKIT.quizSubmitConfirm}>
        <AlertDialogHeader>
          <AlertDialogTitle>هل أنت متأكد من تسليم الإجابات؟</AlertDialogTitle>
          <AlertDialogDescription>
            لا يمكنك التراجع بعد التأكيد.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel className="min-h-11">إلغاء</AlertDialogCancel>
          <AlertDialogAction className="min-h-11" onClick={onConfirm}>
            تأكيد التسليم
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
