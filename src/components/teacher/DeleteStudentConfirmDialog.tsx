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

interface DeleteStudentConfirmDialogProps {
  open: boolean;
  studentName: string;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
}

export function DeleteStudentConfirmDialog({
  open,
  studentName,
  onOpenChange,
  onConfirm,
}: DeleteStudentConfirmDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent dir="rtl">
        <AlertDialogHeader>
          <AlertDialogTitle>تأكيد الإزالة من قائمتك</AlertDialogTitle>
          <AlertDialogDescription>
            سيتم إزالة الطالب ({studentName}) من قائمة طلابك فقط، ولن يتم حذف
            حسابه أو سجل أداءه.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel className="h-11">إلغاء</AlertDialogCancel>
          <AlertDialogAction
            className="h-11 bg-destructive text-destructive-foreground hover:bg-destructive/90"
            onClick={onConfirm}
          >
            إزالة من قائمتك
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
