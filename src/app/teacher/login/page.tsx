"use client";

import { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { useFormState, useFormStatus } from "react-dom";
import { loginTeacherEmail } from "@/actions/auth";
import {
  requestTeacherMagicLink,
  requestTeacherPasswordReset,
} from "@/actions/teacher-login-recovery";
import type { LoginState } from "@/types/auth";
import { loginMessageForCode } from "@/lib/login-ui-messages";
import { TEACHER_LOGIN_MESSAGES } from "@/lib/teacher-login-messages";
import { MobileShell, StickyBottomBar } from "@/components/layout/MobileShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { BrandHeader } from "@/components/brand/BrandHeader";
import { HubToast } from "@/components/teacher/HubToast";
import { ChevronRight, Loader2, LogIn, Mail } from "lucide-react";
import { SPEKIT, spekit } from "@/lib/spekit-targets";

const initialState: LoginState | null = null;

type Mode = "login" | "forgot" | "magic";

function LoginSubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" variant="brand" size="touch" className="w-full" disabled={pending}>
      {pending ? (
        <>
          <Loader2 className="size-5 animate-spin" />
          جاري الدخول...
        </>
      ) : (
        <>
          <LogIn className="size-5" />
          دخول المدرس
        </>
      )}
    </Button>
  );
}

function Alert({ message }: { message: string }) {
  return (
    <div
      role="alert"
      className="rounded-xl border border-destructive/25 bg-destructive/5 px-3.5 py-3 text-xs font-semibold text-destructive"
    >
      {message}
    </div>
  );
}

export default function TeacherLoginPage() {
  const [state, formAction] = useFormState(loginTeacherEmail, initialState);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState<Mode>("login");
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    if (state?.status === "success") {
      window.location.assign("/teacher/dashboard");
    }
  }, [state]);

  const loginError =
    state?.status === "error" ? loginMessageForCode(state.code) : null;

  function submitRecovery(kind: "forgot" | "magic") {
    setError(null);
    startTransition(async () => {
      const result =
        kind === "forgot"
          ? await requestTeacherPasswordReset(email)
          : await requestTeacherMagicLink(email);
      if (result.status === "success") {
        setToast(
          kind === "forgot"
            ? TEACHER_LOGIN_MESSAGES.successResetMail
            : TEACHER_LOGIN_MESSAGES.successMagicMail
        );
        setMode("login");
        return;
      }
      setError(loginMessageForCode(result.code));
    });
  }

  return (
    <MobileShell className="min-h-dvh bg-gradient-to-b from-brand-50/40 via-background to-background">
      <div className="px-2 pb-6 pt-2">
        <BrandHeader />
      </div>

      <div className="card-native mx-auto max-w-md" {...spekit(SPEKIT.teacherEmailLoginForm)}>
        <div className="card-native-header space-y-3">
          <Link
            href="/login"
            className="inline-flex min-h-10 items-center gap-1 text-sm font-medium text-muted-foreground hover:text-foreground"
            {...spekit(SPEKIT.teacherLoginBack)}
          >
            <ChevronRight className="size-4" aria-hidden />
            {TEACHER_LOGIN_MESSAGES.backToMainLogin}
          </Link>
          <div>
            <h1 className="flex items-center gap-2 text-lg font-extrabold">
              <Mail className="size-5 text-brand-600" />
              دخول المدرس
            </h1>
            <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">
              للمدرسين الذين أنشأهم Super Admin — استخدم البريد وكلمة المرور
            </p>
          </div>
        </div>

        {mode === "login" ? (
          <form action={formAction}>
            <div className="space-y-4 p-5">
              <div className="space-y-2">
                <Label htmlFor="teacher_email">البريد الإلكتروني</Label>
                <Input
                  id="teacher_email"
                  name="email"
                  type="email"
                  dir="ltr"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="h-12"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="teacher_password">كلمة المرور</Label>
                <Input
                  id="teacher_password"
                  name="password"
                  type="password"
                  dir="ltr"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="h-12"
                />
                <button
                  type="button"
                  className="text-start text-sm font-medium text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
                  onClick={() => {
                    setError(null);
                    setMode("forgot");
                  }}
                  {...spekit(SPEKIT.teacherForgotPasswordLink)}
                >
                  {TEACHER_LOGIN_MESSAGES.forgotPassword}
                </button>
              </div>
              {loginError ? <Alert message={loginError} /> : null}
            </div>

            <StickyBottomBar className="relative space-y-3 border-0 bg-transparent px-5 pb-5 shadow-none">
              <LoginSubmitButton />
              <button
                type="button"
                className="w-full text-center text-sm font-medium text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
                onClick={() => {
                  setError(null);
                  setMode("magic");
                }}
                {...spekit(SPEKIT.teacherMagicLinkCta)}
              >
                {TEACHER_LOGIN_MESSAGES.magicLinkCta}
              </button>
            </StickyBottomBar>
          </form>
        ) : (
          <form
            className="space-y-4 p-5"
            {...spekit(
              mode === "forgot"
                ? SPEKIT.teacherForgotPasswordForm
                : SPEKIT.teacherMagicLinkForm
            )}
            onSubmit={(e) => {
              e.preventDefault();
              submitRecovery(mode === "forgot" ? "forgot" : "magic");
            }}
          >
            <div className="space-y-2">
              <Label htmlFor="recovery_email">البريد الإلكتروني</Label>
              <Input
                id="recovery_email"
                name="email"
                type="email"
                dir="ltr"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="h-12"
              />
            </div>
            {error ? <Alert message={error} /> : null}
            <Button
              type="submit"
              variant="brand"
              size="touch"
              className="w-full"
              disabled={pending}
              {...spekit(
                mode === "forgot"
                  ? SPEKIT.teacherForgotPasswordSubmit
                  : SPEKIT.teacherMagicLinkSubmit
              )}
            >
              {pending ? (
                <>
                  <Loader2 className="size-5 animate-spin" />
                  جاري الإرسال...
                </>
              ) : mode === "forgot" ? (
                TEACHER_LOGIN_MESSAGES.sendReset
              ) : (
                TEACHER_LOGIN_MESSAGES.sendMagic
              )}
            </Button>
            <button
              type="button"
              className="w-full text-center text-sm font-medium text-muted-foreground hover:text-foreground"
              onClick={() => {
                setError(null);
                setMode("login");
              }}
            >
              {TEACHER_LOGIN_MESSAGES.backToTeacherLogin}
            </button>
          </form>
        )}
      </div>
      <HubToast message={toast} onDismiss={() => setToast(null)} />
    </MobileShell>
  );
}
