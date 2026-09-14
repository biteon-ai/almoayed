"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { completeTeacherPasswordReset } from "@/actions/teacher-login-recovery";
import { loginMessageForCode } from "@/lib/login-ui-messages";
import { TEACHER_LOGIN_MESSAGES } from "@/lib/teacher-login-messages";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import { SPEKIT, spekit } from "@/lib/spekit-targets";

export function TeacherResetForm({ token }: { token: string }) {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [pending, startTransition] = useTransition();

  if (done) {
    return (
      <div className="space-y-4 p-5">
        <p className="text-sm font-medium text-emerald-800">
          {TEACHER_LOGIN_MESSAGES.resetSuccess}
        </p>
        <Link
          href="/teacher/login"
          className="inline-flex min-h-10 items-center text-sm font-semibold text-brand-700"
        >
          {TEACHER_LOGIN_MESSAGES.goTeacherLogin}
        </Link>
      </div>
    );
  }

  return (
    <form
      className="space-y-4 p-5"
      onSubmit={(e) => {
        e.preventDefault();
        setError(null);
        startTransition(async () => {
          const result = await completeTeacherPasswordReset({
            token,
            password,
            confirm,
          });
          if (result.status === "success") {
            setDone(true);
            return;
          }
          setError(loginMessageForCode(result.code));
        });
      }}
    >
      <div className="space-y-2">
        <Label htmlFor="new_password">{TEACHER_LOGIN_MESSAGES.newPassword}</Label>
        <Input
          id="new_password"
          type="password"
          dir="ltr"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          className="h-12"
          {...spekit(SPEKIT.teacherResetPassword)}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="confirm_password">
          {TEACHER_LOGIN_MESSAGES.confirmPassword}
        </Label>
        <Input
          id="confirm_password"
          type="password"
          dir="ltr"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          required
          className="h-12"
          {...spekit(SPEKIT.teacherResetPasswordConfirm)}
        />
      </div>
      {error ? (
        <div
          role="alert"
          className="rounded-xl border border-destructive/25 bg-destructive/5 px-3.5 py-3 text-xs font-semibold text-destructive"
        >
          {error}
        </div>
      ) : null}
      <Button
        type="submit"
        variant="brand"
        size="touch"
        className="w-full"
        disabled={pending}
        {...spekit(SPEKIT.teacherResetSubmit)}
      >
        {pending ? (
          <>
            <Loader2 className="size-5 animate-spin" />
            جاري الحفظ...
          </>
        ) : (
          TEACHER_LOGIN_MESSAGES.savePassword
        )}
      </Button>
    </form>
  );
}
