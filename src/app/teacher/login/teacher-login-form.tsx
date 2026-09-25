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
import { APP_FOOTER_COPYRIGHT } from "@/lib/constants";
import { AppVersion } from "@/components/brand/AppVersion";
import { StickyBottomBar } from "@/components/layout/MobileShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { HubToast } from "@/components/teacher/HubToast";
import { PwaInstallPrompt } from "@/components/pwa/PwaInstallPrompt";
import { PwaPortalMarker } from "@/components/pwa/PwaPortalMarker";
import { ChevronRight, Loader2, LogIn, Mail } from "lucide-react";
import { SPEKIT, spekit } from "@/lib/spekit-targets";

const initialState: LoginState | null = null;

type Mode = "login" | "forgot" | "magic";

function LoginSubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button
      type="submit"
      variant="brand"
      size="touch"
      className="w-full bg-indigo-600 hover:bg-indigo-700 focus-visible:ring-indigo-500/25"
      disabled={pending}
    >
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

export function TeacherLoginForm() {
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
    <div className="flex flex-1 flex-col items-start px-4 pb-8 pt-3 sm:px-6 lg:justify-center lg:px-10 lg:pt-8 xl:px-16">
      <PwaPortalMarker portal="teacher" />
      <div
        className="card-native mx-auto w-full max-w-md"
        {...spekit(SPEKIT.teacherEmailLoginForm)}
      >
        <div className="card-native-header space-y-3">
          <Link
            href="/login"
            className="inline-flex min-h-10 items-center gap-1 text-start text-sm font-medium text-muted-foreground hover:text-foreground"
            {...spekit(SPEKIT.teacherLoginBack)}
          >
            <ChevronRight className="size-4 shrink-0" aria-hidden />
            {TEACHER_LOGIN_MESSAGES.backToMainLogin}
          </Link>
          <div>
            <h1 className="flex items-center gap-2 text-lg font-extrabold">
              <Mail className="size-5 shrink-0 text-indigo-600" />
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
                  autoComplete="email"
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
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="h-12"
                />
                <button
                  type="button"
                  className="min-h-10 text-start text-sm font-medium text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
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
                className="min-h-10 w-full text-center text-sm font-medium text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
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
                autoComplete="email"
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
              className="w-full bg-indigo-600 hover:bg-indigo-700 focus-visible:ring-indigo-500/25"
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
              className="min-h-10 w-full text-center text-sm font-medium text-muted-foreground hover:text-foreground"
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

      <div className="mx-auto mt-6 w-full max-w-md space-y-4">
        <PwaInstallPrompt variant="teacher" />
        <div className="flex flex-col items-center gap-1 text-center lg:hidden">
          <p className="text-[11px] leading-snug text-muted-foreground sm:text-xs">
            {APP_FOOTER_COPYRIGHT}
          </p>
          <AppVersion />
        </div>
      </div>

      <HubToast message={toast} onDismiss={() => setToast(null)} />
    </div>
  );
}
