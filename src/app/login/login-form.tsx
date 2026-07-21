"use client";

import { useEffect, useRef, useState } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { useSearchParams } from "next/navigation";
import { registerStudent, loginDemoAccount } from "@/actions/login";
import { startBiteonSwitchOtp } from "@/actions/biteonswitch";
import type { LoginState } from "@/types/auth";
import type { StartOtpState } from "@/actions/biteonswitch";
import {
  loginMessageForCode,
  loginMessageForQueryError,
} from "@/lib/login-ui-messages";
import { DEMO_STUDENT, DEMO_TEACHER } from "@/lib/constants";
import { MobileShell, StickyBottomBar } from "@/components/layout/MobileShell";
import { LoginLoadingOverlay } from "@/components/login/LoginLoadingOverlay";
import { Button } from "@/components/ui/button";
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
  LogIn,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { SPEKIT, spekit } from "@/lib/spekit-targets";

const initialRegister: LoginState | null = null;
const initialOtp: StartOtpState | null = null;
const initialDemo: LoginState | null = null;

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

function OtpSubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button
      type="submit"
      variant="whatsapp"
      size="touch"
      className="w-full"
      disabled={pending}
      data-spekit={SPEKIT.loginOtpCta}
    >
      {pending ? (
        <>
          <Loader2 className="size-5 animate-spin" />
          جاري التحويل...
        </>
      ) : (
        <>
          <LogIn className="size-5" />
          تسجيل الدخول عبر واتساب
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

type LoginFormProps = {
  demoEnabled: boolean;
};

export function LoginForm({ demoEnabled }: LoginFormProps) {
  const searchParams = useSearchParams();
  const queryError = loginMessageForQueryError(searchParams.get("error"));

  const registerFormRef = useRef<HTMLFormElement>(null);
  const otpFormRef = useRef<HTMLFormElement>(null);
  const demoFormRef = useRef<HTMLFormElement>(null);

  const [registerState, registerAction] = useFormState(
    registerStudent,
    initialRegister
  );
  const [otpState, otpAction] = useFormState(startBiteonSwitchOtp, initialOtp);
  const [demoState, demoAction] = useFormState(loginDemoAccount, initialDemo);

  const [whatsapp, setWhatsapp] = useState("");
  const [fullName, setFullName] = useState("");
  const [teacherCode, setTeacherCode] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showLoadingOverlay, setShowLoadingOverlay] = useState(false);
  const [redirectRole, setRedirectRole] = useState<"TEACHER" | "STUDENT" | null>(
    null
  );
  const [banner, setBanner] = useState<string | null>(null);

  useEffect(() => {
    if (otpState?.status === "redirect") {
      setShowLoadingOverlay(true);
      window.location.assign(otpState.redirectUrl);
    }
  }, [otpState]);

  useEffect(() => {
    if (demoState?.status === "success") {
      setRedirectRole(demoState.role);
      setShowLoadingOverlay(true);
      const path =
        demoState.role === "TEACHER" ? "/teacher/dashboard" : "/dashboard";
      window.location.assign(path);
      return;
    }
    if (demoState?.status === "error") {
      setShowLoadingOverlay(false);
      setRedirectRole(null);
    }
  }, [demoState]);

  useEffect(() => {
    if (registerState?.status === "registered") {
      setBanner(
        "تم إنشاء حسابك وربطه بالأستاذ. أكمل تسجيل الدخول عبر واتساب الآن."
      );
      setShowLoadingOverlay(false);
    }
    if (registerState?.status === "already_registered") {
      setBanner(loginMessageForCode("ALREADY_REGISTERED"));
      setShowLoadingOverlay(false);
    }
    if (registerState?.status === "error") {
      setShowLoadingOverlay(false);
      setBanner(null);
    }
  }, [registerState]);

  const submitDemo = (number: string, name: string) => {
    setWhatsapp(number);
    setFullName(name);
    setTeacherCode("");
    requestAnimationFrame(() => demoFormRef.current?.requestSubmit());
  };

  const errorMessage =
    (registerState?.status === "error" &&
      loginMessageForCode(registerState.code)) ||
    (otpState?.status === "error" && loginMessageForCode(otpState.code)) ||
    (demoState?.status === "error" && loginMessageForCode(demoState.code)) ||
    queryError;

  const loadingMessage =
    redirectRole === "TEACHER"
      ? "جاري فتح لوحة الأستاذ…"
      : redirectRole === "STUDENT"
        ? "جاري فتح لوحة الطالب…"
        : isSubmitting
          ? "جاري المعالجة…"
          : "جاري فتح لوحتك…";

  return (
    <MobileShell className="min-h-dvh bg-gradient-to-b from-slate-50 via-background to-background dark:from-slate-950 dark:via-background">
      <LoginLoadingOverlay
        show={showLoadingOverlay}
        message={loadingMessage}
        subMessage="لحظة من فضلك…"
      />

      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-56 bg-gradient-to-b from-brand-100/40 to-transparent dark:from-brand-950/25"
        aria-hidden
      />

      <div className="relative flex min-h-[calc(100dvh-env(safe-area-inset-top)-env(safe-area-inset-bottom))] flex-col">
        <div
          className={cn(
            "flex-1 overflow-y-auto overscroll-y-contain pb-44 transition-opacity duration-300",
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
                تسجيل طالب جديد
              </h1>
              <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">
                أدخل اسمك وواتسابك ورمز الأستاذ — بعدها سجّل الدخول عبر واتساب
              </p>
            </div>

            <div className="space-y-5 p-5">
              <form
                ref={registerFormRef}
                action={registerAction}
                className="space-y-5"
                {...spekit(SPEKIT.loginForm)}
              >
                <FormPendingWatcher
                  onPendingChange={setIsSubmitting}
                  onSubmitStart={() => setShowLoadingOverlay(true)}
                />

                <div className="space-y-2" {...spekit(SPEKIT.loginNameField)}>
                  <Label
                    htmlFor="full_name"
                    className="flex items-center gap-1.5 text-xs font-bold text-slate-700 dark:text-slate-300"
                  >
                    <User className="size-3.5 text-brand-600" />
                    اسمك
                  </Label>
                  <Input
                    id="full_name"
                    name="full_name"
                    placeholder="مثال: أحمد الخطيب"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required
                    disabled={showLoadingOverlay}
                  />
                </div>

                <div
                  className="space-y-2"
                  {...spekit(SPEKIT.loginWhatsappField)}
                >
                  <Label
                    htmlFor="whatsapp_number"
                    className="flex items-center gap-1.5 text-xs font-bold text-slate-700 dark:text-slate-300"
                  >
                    <MessageCircle className="size-3.5 text-brand-600" />
                    رقم واتساب
                  </Label>
                  <div className="input-touch-group">
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
                    />
                  </div>
                  <p className="flex items-center gap-1 px-0.5 text-[11px] text-muted-foreground">
                    <ChevronLeft className="size-3 rotate-180 opacity-50" />
                    <span className="font-mono font-semibold" dir="ltr">
                      9639xxxxxxxx
                    </span>
                  </p>
                </div>

                <div
                  className="space-y-2"
                  {...spekit(SPEKIT.loginTeacherCode)}
                >
                  <Label
                    htmlFor="teacher_code"
                    className="flex items-center gap-1.5 text-xs font-bold text-slate-700 dark:text-slate-300"
                  >
                    <Key className="size-3.5 text-brand-600" />
                    رمز الأستاذ
                  </Label>
                  <Input
                    id="teacher_code"
                    name="teacher_code"
                    placeholder="AlMoayed-XXXX"
                    value={teacherCode}
                    onChange={(e) => setTeacherCode(e.target.value)}
                    className="font-mono tracking-wide"
                    dir="ltr"
                    required
                    disabled={showLoadingOverlay}
                  />
                </div>
              </form>

              {(banner || errorMessage) && !isSubmitting && (
                <div
                  role="alert"
                  className={cn(
                    "rounded-xl border px-3.5 py-3 text-xs font-semibold",
                    errorMessage && !banner
                      ? "border-destructive/25 bg-destructive/5 text-destructive"
                      : "border-brand-200/80 bg-brand-50/60 text-brand-900 dark:border-brand-900/40 dark:bg-brand-950/20 dark:text-brand-100"
                  )}
                >
                  {banner || errorMessage}
                </div>
              )}

              <form action={otpAction} ref={otpFormRef} className="space-y-2">
                <input type="hidden" name="whatsapp_number" value={whatsapp} />
                <p className="text-center text-[11px] font-semibold text-muted-foreground">
                  عندك حساب؟ سجّل الدخول بدون إعادة التسجيل
                </p>
                <OtpSubmitButton />
              </form>

              {demoEnabled && (
                <div className="space-y-3 border-t border-border/50 pt-4">
                  <p className="text-center text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                    أو جرّب الحسابات التجريبية
                  </p>

                  <form ref={demoFormRef} action={demoAction} className="hidden">
                    <input type="hidden" name="whatsapp_number" value={whatsapp} />
                    <input type="hidden" name="full_name" value={fullName} />
                  </form>

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
              )}
            </div>
          </div>

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

        <StickyBottomBar
          className={cn(
            "fixed inset-x-0 bottom-0 mx-auto max-w-md px-4 transition-opacity duration-300",
            showLoadingOverlay && "pointer-events-none opacity-40"
          )}
        >
          <Button
            type="button"
            variant="brand"
            size="touch"
            className="w-full shadow-brand-900/20"
            disabled={showLoadingOverlay}
            data-spekit={SPEKIT.loginSubmit}
            onClick={() => registerFormRef.current?.requestSubmit()}
          >
            <User className="size-5" />
            إنشاء حساب طالب
          </Button>
          <p className="mt-2 text-center text-[10px] text-muted-foreground">
            التسجيل لا يفتح الجلسة — لازم تسجيل الدخول عبر واتساب بعدها
          </p>
        </StickyBottomBar>
      </div>
    </MobileShell>
  );
}
