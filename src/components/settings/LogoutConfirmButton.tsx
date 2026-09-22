"use client";

import { useEffect, useRef, useState } from "react";
import { useFormStatus } from "react-dom";
import { logout } from "@/actions/auth";
import { startTopNavLoader } from "@/components/ui/top-loader";
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
import { Loader2, LogOut } from "lucide-react";
import { SPEKIT } from "@/lib/spekit-targets";

function LogoutPendingWatcher({
  onPendingChange,
}: {
  onPendingChange: (pending: boolean) => void;
}) {
  const { pending } = useFormStatus();
  useEffect(() => {
    onPendingChange(pending);
  }, [pending, onPendingChange]);
  return null;
}

export function LogoutConfirmButton() {
  const [open, setOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  const startLogout = () => {
    if (isLoggingOut) return;
    setIsLoggingOut(true);
    startTopNavLoader();
    // Native requestSubmit — no synthetic click event involved.
    formRef.current?.requestSubmit();
  };

  return (
    <div className="pt-1">
      <form
        ref={formRef}
        action={logout}
        className="hidden"
        onSubmit={() => {
          setIsLoggingOut(true);
          startTopNavLoader();
        }}
      >
        <LogoutPendingWatcher onPendingChange={setIsLoggingOut} />
      </form>

      <Button
        type="button"
        variant="destructive"
        className="h-12 w-full gap-2 rounded-lg"
        disabled={isLoggingOut}
        aria-busy={isLoggingOut}
        data-spekit={SPEKIT.studentLogout}
        onClick={() => {
          if (!isLoggingOut) setOpen(true);
        }}
      >
        {isLoggingOut ? (
          <>
            <Loader2 className="size-4 animate-spin" aria-hidden />
            جاري تسجيل الخروج...
          </>
        ) : (
          <>
            <LogOut className="size-4" aria-hidden />
            تسجيل الخروج
          </>
        )}
      </Button>

      <AlertDialog
        open={open}
        onOpenChange={(next) => {
          if (isLoggingOut) return;
          setOpen(next);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>تأكيد تسجيل الخروج</AlertDialogTitle>
            <AlertDialogDescription>
              متأكد بدك تسجّل خروج من حسابك على هذا الجهاز؟
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isLoggingOut}>إلغاء</AlertDialogCancel>
            <AlertDialogAction
              className="inline-flex items-center justify-center gap-2 bg-destructive hover:bg-destructive/90"
              disabled={isLoggingOut}
              closeOnClick={false}
              onClick={startLogout}
            >
              {isLoggingOut ? (
                <>
                  <Loader2 className="size-4 animate-spin" aria-hidden />
                  جاري تسجيل الخروج...
                </>
              ) : (
                "نعم، خروج"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
