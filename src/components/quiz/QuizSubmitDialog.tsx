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
  confirming = false,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  confirming?: boolean;
}) {
  return (
    <AlertDialog
      open={open}
      onOpenChange={(next) => {
        if (confirming && !next) return;
        onOpenChange(next);
      }}
    >
      <AlertDialogContent dir="rtl" data-spekit={SPEKIT.quizSubmitConfirm}>
        <AlertDialogHeader>
          <AlertDialogTitle>هل أنت متأكد من تسليم الإجابات؟</AlertDialogTitle>
          <AlertDialogDescription>
            لا يمكنك التراجع بعد التأكيد.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel className="min-h-11" disabled={confirming}>
            إلغاء
          </AlertDialogCancel>
          <AlertDialogAction
            className="min-h-11"
            disabled={confirming}
            onClick={onConfirm}
          >
            {confirming ? "جاري التسليم..." : "تأكيد التسليم"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
