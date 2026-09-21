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

export function QuizUnansweredDialog({
  open,
  onOpenChange,
  onReview,
  onSubmitAnyway,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onReview: () => void;
  onSubmitAnyway: () => void;
}) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent dir="rtl" data-spekit={SPEKIT.quizUnansweredAlert}>
        <AlertDialogHeader>
          <AlertDialogTitle>لديك أسئلة لم تقم بالإجابة عليها</AlertDialogTitle>
          <AlertDialogDescription>
            هل تريد العودة لإجابتها؟
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel className="min-h-11" onClick={onSubmitAnyway}>
            التسليم على أي حال
          </AlertDialogCancel>
          <AlertDialogAction className="min-h-11" onClick={onReview}>
            العودة للإجابة
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
