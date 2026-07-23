"use client";

import { useEffect, useState } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { loginTeacherEmail } from "@/actions/auth";
import type { LoginState } from "@/types/auth";
import { loginMessageForCode } from "@/lib/login-ui-messages";
import { MobileShell, StickyBottomBar } from "@/components/layout/MobileShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { BrandHeader } from "@/components/brand/BrandHeader";
import { Loader2, LogIn, Mail } from "lucide-react";
import { SPEKIT, spekit } from "@/lib/spekit-targets";

const initialState: LoginState | null = null;

function SubmitButton() {
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

export default function TeacherLoginPage() {
  const [state, formAction] = useFormState(loginTeacherEmail, initialState);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  useEffect(() => {
    if (state?.status === "success") {
      window.location.assign("/teacher/dashboard");
    }
  }, [state]);

  return (
    <MobileShell className="min-h-dvh bg-gradient-to-b from-brand-50/40 via-background to-background">
      <div className="px-2 pb-6 pt-2">
        <BrandHeader />
      </div>

      <form
        action={formAction}
        className="card-native mx-auto max-w-md"
        {...spekit(SPEKIT.teacherEmailLoginForm)}
      >
        <div className="card-native-header">
          <h1 className="flex items-center gap-2 text-lg font-extrabold">
            <Mail className="size-5 text-brand-600" />
            دخول المدرس
          </h1>
          <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">
            للمدرسين الذين أنشأهم Super Admin — استخدم البريد وكلمة المرور
          </p>
        </div>

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
          </div>
          {state?.status === "error" ? (
            <div
              role="alert"
              className="rounded-xl border border-destructive/25 bg-destructive/5 px-3.5 py-3 text-xs font-semibold text-destructive"
            >
              {loginMessageForCode(state.code)}
            </div>
          ) : null}
        </div>

        <StickyBottomBar className="relative border-0 bg-transparent px-5 pb-5 shadow-none">
          <SubmitButton />
        </StickyBottomBar>
      </form>
    </MobileShell>
  );
}
