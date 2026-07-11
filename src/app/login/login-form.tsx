"use client";

import { useEffect, useRef, useState } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { loginWithWhatsApp } from "@/actions/login";
import type { LoginState } from "@/types/auth";
import { DEMO_STUDENT, DEMO_TEACHER } from "@/lib/constants";
import { MobileShell, StickyBottomBar } from "@/components/layout/MobileShell";
import { LoginLoadingOverlay } from "@/components/login/LoginLoadingOverlay";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { BrandHeader } from "@/components/brand/BrandHeader";
import {
  MessageCircle,
  User,
  Loader2,
  ShieldCheck,
  BookOpen,
  GraduationCap,
  School,
  Key,
  ChevronLeft,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { SPEKIT, spekit } from "@/lib/spekit-targets";

const initialState: LoginState | null = null;

function FormPendingWatcher({
  onPendingChange,
  onSubmitStart,
}: {
  onPendingChange: (pending: boolean) => void;
  onSubmitStart: () => void;
}) {
  const { pending } = useFormStatus();

  useEffect(() => {
    if (pending) {
      onSubmitStart();
    }
    onPendingChange(pending);
  }, [pending, onPendingChange, onSubmitStart]);

  return null;
}

function PrimarySubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button
      type="submit"
      variant="brand"
      size="touch"
      className="w-full shadow-brand-900/20"
      disabled={pending}
      data-spekit={SPEKIT.loginSubmit}
    >
      {pending ? (
        <>
          <Loader2 className="size-5 animate-spin" />
          جاري التحقق...
        </>
      ) : (
        <>
          <MessageCircle className="size-5 fill-current" />
          دخول عبر واتساب
        </>
      )}
    </Button>
  );
}

function DemoButton({
  onClick,
  label,
  icon: Icon,
}: {
  onClick: () => void;
  label: string;
  icon: React.ElementType;
}) {
  const { pending } = useFormStatus();
  return (
    <Button
      type="button"
      variant="secondary"
      size="lg"
      className="h-12 w-full text-sm"
      onClick={onClick}
      disabled={pending}
    >
      {pending ? (
        <Loader2 className="size-4 animate-spin" />
      ) : (
        <Icon className="size-4 opacity-80" />
      )}
      {pending ? "جاري الدخول..." : label}
    </Button>
  );
}

export function LoginForm() {
  const formRef = useRef<HTMLFormElement>(null);
  const [state, formAction] = useFormState(loginWithWhatsApp, initialState);
  const [whatsapp, setWhatsapp] = useState("");
  const [fullName, setFullName] = useState("");
  const [teacherCode, setTeacherCode] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  /** Stays true after submit until error or page navigates away (server redirect). */
  const [showLoadingOverlay, setShowLoadingOverlay] = useState(false);
  const [redirectRole, setRedirectRole] = useState<"TEACHER" | "STUDENT" | null>(
    null
  );

  useEffect(() => {
    if (state?.status === "success") {
      setRedirectRole(state.role);
      setShowLoadingOverlay(true);
      const path =
        state.role === "TEACHER" ? "/teacher/dashboard" : "/dashboard";
      window.location.assign(path);
      return;
    }
    if (state?.status === "error") {
      setShowLoadingOverlay(false);
      setRedirectRole(null);
    }
  }, [state]);

  const submitDemo = (number: string, name: string) => {
    setWhatsapp(number);
    setFullName(name);
    setTeacherCode("");
    requestAnimationFrame(() => formRef.current?.requestSubmit());
  };

  const loadingMessage =
    redirectRole === "TEACHER"
      ? "جاري فتح لوحة الأستاذ…"
      : redirectRole === "STUDENT"
        ? "جاري فتح لوحة الطالب…"
        : isSubmitting
          ? "جاري التحقق من حسابك…"
          : "جاري فتح لوحتك…";

  const loadingSubMessage =
    redirectRole === "TEACHER"
      ? "نحضّر إحصائياتك واختباراتك"
      : redirectRole === "STUDENT"
        ? "نحضّر اختباراتك ونتائجك"
        : isSubmitting
          ? "يتم التحقق عبر واتساب"
          : "لحظة من فضلك…";

  return (
    <MobileShell className="min-h-dvh bg-gradient-to-b from-slate-50 via-background to-background dark:from-slate-950 dark:via-background">
      <LoginLoadingOverlay
        show={showLoadingOverlay}
        message={loadingMessage}
        subMessage={loadingSubMessage}
      />

      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-56 bg-gradient-to-b from-brand-100/40 to-transparent dark:from-brand-950/25"
        aria-hidden
      />

      <form
        ref={formRef}
        action={formAction}
        className="relative flex min-h-[calc(100dvh-env(safe-area-inset-top)-env(safe-area-inset-bottom))] flex-col"
        {...spekit(SPEKIT.loginForm)}
      >
        <FormPendingWatcher
          onPendingChange={setIsSubmitting}
          onSubmitStart={() => setShowLoadingOverlay(true)}
        />

        {/* Scrollable body */}
        <div
          className={cn(
            "flex-1 overflow-y-auto overscroll-y-contain pb-36 transition-opacity duration-300",
            showLoadingOverlay && "pointer-events-none opacity-40"
          )}
        >
          <header className="animate-fade-in px-2 pb-6 pt-2">
            <BrandHeader />
          </header>

          <div className="card-native glow-teal animate-slide-up">
            <div className="h-1 bg-gradient-to-l from-brand-400 via-brand-600 to-brand-800" />

            <div className="card-native-header">
              <h1 className="text-lg font-extrabold tracking-tight text-slate-900 dark:text-slate-50">
                أهلاً فيك
              </h1>
              <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">
                سجّل دخولك برقم واتساب — بدون إيميل ولا كلمة سر
              </p>
            </div>

            <div className="space-y-5 p-5">
              <div className="space-y-5">
                {/* WhatsApp */}
                <div className="space-y-2" {...spekit(SPEKIT.loginWhatsappField)}>
                  <Label
                    htmlFor="whatsapp_number"
                    className="flex items-center gap-1.5 text-xs font-bold text-slate-700 dark:text-slate-300"
                  >
                    <MessageCircle className="size-3.5 text-brand-600" />
                    رقم واتساب
                  </Label>
                  <div
                    className={cn(
                      "input-touch-group",
                      state?.status === "error" &&
                        "border-destructive/40 focus-within:ring-destructive/15"
                    )}
                  >
                    <span className="input-touch-prefix" dir="ltr">
                      <span className="size-2 rounded-full bg-[#25D366]" />
                      +963
                    </span>
                    <Input
                      id="whatsapp_number"
                      name="whatsapp_number"
                      type="tel"
                      inputMode="numeric"
                      autoComplete="tel"
                      placeholder="9xx xxx xxx"
                      value={whatsapp}
                      onChange={(e) => setWhatsapp(e.target.value)}
                      className="h-[52px] rounded-none border-0 bg-transparent shadow-none focus-visible:ring-0"
                      dir="ltr"
                      required
                      disabled={showLoadingOverlay}
                      aria-describedby="phone-hint"
                    />
                  </div>
                  <p
                    id="phone-hint"
                    className="flex items-center gap-1 px-0.5 text-[11px] text-muted-foreground"
                  >
                    <ChevronLeft className="size-3 rotate-180 opacity-50" />
                    <span>مثال:</span>
                    <span className="font-mono font-semibold text-foreground/80" dir="ltr">
                      9639xxxxxxxx
                    </span>
                  </p>
                </div>

                {/* Teacher code */}
                <div className="space-y-2" {...spekit(SPEKIT.loginTeacherCode)}>
                  <Label
                    htmlFor="teacher_code"
                    className="flex items-center gap-1.5 text-xs font-bold text-slate-700 dark:text-slate-300"
                  >
                    <Key className="size-3.5 text-brand-600" />
                    رمز الأستاذ
                    <span className="font-normal text-muted-foreground">
                      (للتسجيل الجديد)
                    </span>
                  </Label>
                  <Input
                    id="teacher_code"
                    name="teacher_code"
                    placeholder="AlMoayed-XXXX"
                    value={teacherCode}
                    onChange={(e) => setTeacherCode(e.target.value)}
                    className="font-mono tracking-wide"
                    dir="ltr"
                    disabled={showLoadingOverlay}
                  />
                </div>

                {/* Name */}
                <div className="space-y-2" {...spekit(SPEKIT.loginNameField)}>
                  <Label
                    htmlFor="full_name"
                    className="flex items-center gap-1.5 text-xs font-bold text-slate-700 dark:text-slate-300"
                  >
                    <User className="size-3.5 text-brand-600" />
                    اسمك
                    <span className="font-normal text-muted-foreground">(اختياري)</span>
                  </Label>
                  <Input
                    id="full_name"
                    name="full_name"
                    placeholder="مثال: أحمد الخطيب"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    disabled={showLoadingOverlay}
                  />
                </div>

                {state?.status === "error" && !isSubmitting && (
                  <div
                    role="alert"
                    className="rounded-xl border border-destructive/25 bg-destructive/5 px-3.5 py-3 text-xs font-semibold text-destructive"
                  >
                    {state.message}
                  </div>
                )}
              </div>

              {/* Demo blocks */}
              <div className="space-y-3 border-t border-border/50 pt-4">
                <p className="text-center text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  أو جرّب الحسابات التجريبية
                </p>

                <div
                  className="space-y-2.5 rounded-xl border border-dashed border-brand-200/70 bg-brand-50/30 p-3.5 dark:border-brand-900/40 dark:bg-brand-950/10"
                  {...spekit(SPEKIT.loginDemoStudent)}
                >
                  <p className="flex items-center gap-1.5 text-xs font-bold text-brand-800 dark:text-brand-300">
                    <GraduationCap className="size-3.5" />
                    طالب زائر؟ تصفح الحساب التجريبي
                  </p>
                  <DemoButton
                    icon={GraduationCap}
                    label="دخول تجريبي — طالب"
                    onClick={() =>
                      submitDemo(
                        DEMO_STUDENT.whatsapp_number,
                        DEMO_STUDENT.full_name
                      )
                    }
                  />
                </div>

                <div
                  className="space-y-2.5 rounded-xl border border-dashed border-amber-200/70 bg-amber-50/25 p-3.5 dark:border-amber-900/40 dark:bg-amber-950/10"
                  {...spekit(SPEKIT.loginDemoTeacher)}
                >
                  <p className="flex items-center gap-1.5 text-xs font-bold text-amber-900 dark:text-amber-300">
                    <School className="size-3.5" />
                    مدرس؟ تصفح الحساب التجريبي
                  </p>
                  <DemoButton
                    icon={School}
                    label="دخول تجريبي — أستاذ"
                    onClick={() =>
                      submitDemo(
                        DEMO_TEACHER.whatsapp_number,
                        DEMO_TEACHER.full_name
                      )
                    }
                  />
                </div>
              </div>
            </div>
          </div>

          {state?.status === "needs_verification" && (
            <div
              className="mt-4 space-y-3 rounded-xl border border-amber-200/80 bg-amber-50/50 p-4 dark:border-amber-900/40 dark:bg-amber-950/15"
              {...spekit(SPEKIT.loginVerificationPanel)}
            >
              <div className="flex gap-2.5 text-start">
                <ShieldCheck className="mt-0.5 size-5 shrink-0 text-amber-600" />
                <div>
                  <p className="text-sm font-bold text-amber-900 dark:text-amber-200">
                    حسابك بانتظار التفعيل
                  </p>
                  <p className="mt-1 text-xs leading-relaxed text-amber-800/80">
                    {state.message}
                  </p>
                </div>
              </div>
              <a
                href={state.verificationUrl}
                target="_blank"
                rel="noopener noreferrer"
                className={cn(
                  buttonVariants({ variant: "whatsapp", size: "touch" }),
                  "w-full"
                )}
              >
                <MessageCircle className="size-5 fill-current" />
                تفعيل عبر واتساب
              </a>
            </div>
          )}

          <footer className="mt-6 space-y-3 pb-2 text-center">
            <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-[11px] font-semibold text-muted-foreground">
              <span className="inline-flex items-center gap-1">
                <BookOpen className="size-3.5 text-brand-500" />
                اختبارات شاملة
              </span>
              <span className="size-1 rounded-full bg-border" />
              <span className="inline-flex items-center gap-1">
                <ShieldCheck className="size-3.5 text-brand-500" />
                حلول مقفولة
              </span>
            </div>
          </footer>
        </div>

        {/* Fixed bottom CTA */}
        <StickyBottomBar
          className={cn(
            "fixed inset-x-0 bottom-0 mx-auto max-w-md px-4 transition-opacity duration-300",
            showLoadingOverlay && "pointer-events-none opacity-40"
          )}
        >
          <PrimarySubmitButton />
          <p className="mt-2 text-center text-[10px] text-muted-foreground">
            بالضغط أنت توافق على استخدام رقمك للدخول فقط
          </p>
        </StickyBottomBar>
      </form>
    </MobileShell>
  );
}
