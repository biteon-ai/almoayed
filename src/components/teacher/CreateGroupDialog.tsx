"use client";

import { useState, useTransition } from "react";
import { createTeacherGroup } from "@/actions/teacher";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { SPEKIT, spekit } from "@/lib/spekit-targets";

interface CreateGroupDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: (message: string) => void;
  onError: (message: string) => void;
}

export function CreateGroupDialog({
  open,
  onOpenChange,
  onSuccess,
  onError,
}: CreateGroupDialogProps) {
  const [groupName, setGroupName] = useState("");
  const [pending, startTransition] = useTransition();

  const reset = () => setGroupName("");

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) reset();
        onOpenChange(next);
      }}
    >
      <DialogContent {...spekit(SPEKIT.createGroupForm)}>
        <DialogHeader>
          <DialogTitle>إنشاء مجموعة دراسية</DialogTitle>
          <DialogDescription>
            سمِّ المجموعة لتسهيل فلترة الطلاب وتوزيع الاختبارات.
          </DialogDescription>
        </DialogHeader>
        <form
          className="mt-4 space-y-3"
          onSubmit={(e) => {
            e.preventDefault();
            const name = groupName.trim();
            if (!name) {
              onError("أدخل اسم المجموعة.");
              return;
            }
            startTransition(async () => {
              try {
                await createTeacherGroup(name);
                reset();
                onOpenChange(false);
                onSuccess("تم إنشاء المجموعة.");
              } catch (err) {
                onError(
                  err instanceof Error ? err.message : "فشل إنشاء المجموعة."
                );
              }
            });
          }}
        >
          <div className="space-y-1.5">
            <label htmlFor="create-group-name" className="text-sm font-medium">
              اسم المجموعة
            </label>
            <Input
              id="create-group-name"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              placeholder="مثال: شعبة أ"
              className="h-11 text-start"
              required
              autoFocus
            />
          </div>
          <DialogFooter>
            <DialogClose>إلغاء</DialogClose>
            <Button
              type="submit"
              variant="brand"
              className="h-11"
              disabled={pending || !groupName.trim()}
            >
              {pending ? "جاري الإنشاء..." : "إنشاء"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
