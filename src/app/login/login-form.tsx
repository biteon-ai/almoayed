"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { useSearchParams } from "next/navigation";
import {
  registerStudentAndRequestOTP,
  loginDemoAccount,
  linkTeacherCodeAction,
} from "@/actions/login";
import { startBiteonSwitchOtp } from "@/actions/biteonswitch";
import type { LoginState } from "@/types/auth";
import type { StartOtpState } from "@/actions/biteonswitch";
import {
  loginMessageForCode,
  loginMessageForQueryError,
} from "@/lib/login-ui-messages";
import { DEMO_STUDENT, DEMO_TEACHER, APP_FOOTER_COPYRIGHT } from "@/lib/constants";
import { AuthField, AuthInputShell } from "@/components/login/AuthField";
import { LoginLoadingOverlay } from "@/components/login/LoginLoadingOverlay";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  MessageCircle,
  User,
  Loader2,
  GraduationCap,
  School,
  KeyRound,
  LogIn,
  FlaskConical,
  Lock,
  ChevronLeft,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { SPEKIT, spekit } from "@/lib/spekit-targets";

const initialLogin: LoginState | null = null;
const initialOtp: StartOtpState | null = null;

const fieldGap =
  "space-y-4 [@media(max-height:700px)]:space-y-3 sm:space-y-5";
const inputClass =
  "h-12 w-full rounded-xl border-input bg-muted/40 px-4 text-sm transition-all duration-200 placeholder:text-xs focus:border-emerald-500 focus:bg-background focus-visible:ring-[3px] focus-visible:ring-emerald-500/15 focus-visible:ring-offset-0 [@media(max-height:700px)]:h-11 sm:h-12";
const touchBtnClass =
  "h-12 w-full gap-2 rounded-xl text-sm font-bold shadow-md [@media(max-height:700px)]:h-11 sm:h-12";
const tabTriggerClass =
  "h-10 min-h-0 whitespace-nowrap px-2 text-xs font-bold sm:px-3 sm:text-sm data-[active]:bg-white data-[active]:text-emerald-700 data-[active]:shadow-sm dark:data-[active]:bg-card dark:data-[active]:text-emerald-400";

function PendingWatcher({
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

function SubmitButton({
  label,
  pendingLabel,
  variant = "brand",
  spekitId,
  icon: Icon,
}: {
  label: string;
  pendingLabel: string;
  variant?: "brand" | "whatsapp" | "secondary";
  spekitId?: string;
  icon: React.ElementType;
}) {
  const { pending } = useFormStatus();
  return (
    <Button
      type="submit"
      variant={variant}
      size="default"
      className={touchBtnClass}
      disabled={pending}
      data-spekit={spekitId}
    >
      {pending ? (
        <>
          <Loader2 className="size-4 animate-spin" />
          {pendingLabel}
        </>
      ) : (
        <>
          <Icon className="size-4" />
          {label}
        </>
      )}
    </Button>
  );
}

function WhatsAppField({
  id,
  value,
  onChange,
  spekitProps,
}: {
  id: string;
  value: string;
  onChange: (v: string) => void;
  spekitProps?: ReturnType<typeof spekit>;
}) {
  return (
    <AuthField
      id={id}
      label="رقم واتساب"
      icon={MessageCircle}
      spekitProps={spekitProps}
    >
      <AuthInputShell suppressHydrationWarning>
        <span
          className="flex shrink-0 items-center gap-1.5 border-e border-input/80 bg-muted/60 px-3 text-xs font-bold text-foreground sm:text-sm"
          dir="ltr"
        >
          <span
            className="size-1.5 shrink-0 rounded-full bg-[#25D366]"
            aria-hidden
          />
          +963
        </span>
        <input
          id={id}
          name="whatsapp_number"
          type="tel"
          inputMode="numeric"
          autoComplete="tel"
          placeholder="9xx xxx xxx"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="min-w-0 flex-1 bg-transparent px-3 text-sm outline-none placeholder:text-xs"
          dir="ltr"
          required
          suppressHydrationWarning
        />
      </AuthInputShell>
    </AuthField>
  );
}

function DemoQuickLoginButton({
  title,
  subtitle,
  icon: Icon,
  accent,
  onClick,
  spekitId,
}: {
  title: string;
  subtitle: string;
  icon: React.ElementType;
  accent: "student" | "teacher";
  onClick: () => void;
  spekitId?: string;
}) {
  const styles =
    accent === "student"
      ? {
          card: "border-emerald-500/25 bg-emerald-50/50 hover:border-emerald-500/45 hover:bg-emerald-50 hover:shadow-lg hover:shadow-emerald-500/10 dark:bg-emerald-950/20 dark:hover:bg-emerald-950/35",
          icon: "bg-emerald-600 text-white shadow-md shadow-emerald-600/25",
        }
      : {
          card: "border-teal-500/25 bg-teal-50/50 hover:border-teal-500/45 hover:bg-teal-50 hover:shadow-lg hover:shadow-teal-500/10 dark:bg-teal-950/20 dark:hover:bg-teal-950/35",
          icon: "bg-teal-600 text-white shadow-md shadow-teal-600/25",
        };

  return (
    <button
      type="button"
      data-spekit={spekitId}
      onClick={onClick}
      className={cn(
        "group flex w-full items-center gap-4 rounded-2xl border-2 p-4 text-start transition-all duration-300",
        styles.card
      )}
    >
      <div
        className={cn(
          "flex h-12 w-12 shrink-0 items-center justify-center rounded-xl transition-transform duration-300 group-hover:scale-105",
          styles.icon
        )}
      >
        <Icon className="h-6 w-6" />
      </div>
      <div className="min-w-0 flex-1 space-y-0.5">
        <p className="font-bold text-foreground">{title}</p>
        <p className="text-xs leading-relaxed text-muted-foreground">
          {subtitle}
        </p>
      </div>
      <ChevronLeft className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:-translate-x-0.5" />
    </button>
  );
}

type LoginFormProps = {
  demoEnabled: boolean;
  needsTeacherLink: boolean;
  pendingWhatsapp: string;
};

export function LoginForm({
  demoEnabled,
  needsTeacherLink,
  pendingWhatsapp,
}: LoginFormProps) {
  const searchParams = useSearchParams();
  const queryError = loginMessageForQueryError(searchParams.get("error"));
  const tabFromQuery = searchParams.get("tab");
  const needsTeacherQuery = searchParams.get("needs_teacher") === "1";

  const defaultTab = useMemo(() => {
    if (needsTeacherLink || needsTeacherQuery) return "login";
    if (tabFromQuery === "demo" && demoEnabled) return "demo";
    if (tabFromQuery === "login") return "login";
    if (tabFromQuery === "register") return "register";
    return "register";
  }, [demoEnabled, needsTeacherLink, needsTeacherQuery, tabFromQuery]);

  const [tab, setTab] = useState(defaultTab);
  const [whatsapp, setWhatsapp] = useState(pendingWhatsapp);
  const [fullName, setFullName] = useState("");
  const [teacherCode, setTeacherCode] = useState("");
  const [linkCode, setLinkCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [overlay, setOverlay] = useState(false);
  const [banner, setBanner] = useState<string | null>(
    needsTeacherLink || needsTeacherQuery
      ? "تم التحقق من واتساب. أدخل رمز الأستاذ لإكمال الدخول."
      : null
  );
  const [hydrated, setHydrated] = useState(false);
  const [, startTransition] = useTransition();

  const demoFormRef = useRef<HTMLFormElement>(null);

  const [registerState, registerAction] = useFormState(
    registerStudentAndRequestOTP,
    initialLogin
  );
  const [otpState, otpAction] = useFormState(startBiteonSwitchOtp, initialOtp);
  const [demoState, demoAction] = useFormState(loginDemoAccount, initialLogin);
  const [linkState, linkAction] = useFormState(
    linkTeacherCodeAction,
    initialLogin
  );

  useEffect(() => {
    setHydrated(true);
  }, []);

  useEffect(() => {
    setTab(defaultTab);
  }, [defaultTab]);

  useEffect(() => {
    if (!demoEnabled && tab === "demo") {
      setTab("register");
    }
  }, [demoEnabled, tab]);

  useEffect(() => {
    if (otpState?.status === "redirect") {
      setOverlay(true);
      window.location.assign(otpState.redirectUrl);
    }
  }, [otpState]);

  useEffect(() => {
    if (registerState?.status === "redirect") {
      setOverlay(true);
      window.location.assign(registerState.redirectUrl);
      return;
    }
    if (registerState?.status === "already_registered") {
      setBanner(loginMessageForCode("ALREADY_REGISTERED"));
      setTab("login");
      setBusy(false);
      setOverlay(false);
      return;
    }
    if (registerState?.status === "error") {
      setBusy(false);
      setOverlay(false);
    }
  }, [registerState]);

  useEffect(() => {
    const success =
      demoState?.status === "success" || linkState?.status === "success";
    const role =
      demoState?.status === "success"
        ? demoState.role
        : linkState?.status === "success"
          ? linkState.role
          : null;
    if (success && role) {
      setOverlay(true);
      window.location.assign(
        role === "TEACHER" ? "/teacher/dashboard" : "/dashboard"
      );
      return;
    }
    if (demoState?.status === "error" || linkState?.status === "error") {
      setBusy(false);
      setOverlay(false);
    }
  }, [demoState, linkState]);

  const errorMessage =
    (registerState?.status === "error" &&
      loginMessageForCode(registerState.code)) ||
    (otpState?.status === "error" && loginMessageForCode(otpState.code)) ||
    (demoState?.status === "error" && loginMessageForCode(demoState.code)) ||
    (linkState?.status === "error" && loginMessageForCode(linkState.code)) ||
    queryError;

  const submitDemo = (number: string, name: string) => {
    setWhatsapp(number);
    setFullName(name);
    startTransition(() => {
      requestAnimationFrame(() => demoFormRef.current?.requestSubmit());
    });
  };

  const showLinkPanel = needsTeacherLink || needsTeacherQuery;

  return (
    <>
      <LoginLoadingOverlay
        show={overlay}
        message="جاري المتابعة…"
        subMessage="لحظة من فضلك…"
      />

      <div
        className={cn(
          "flex flex-1 items-center justify-center px-4 py-6 sm:px-6 sm:py-8",
          overlay && "pointer-events-none opacity-40"
        )}
      >
          <div
            className="w-full max-w-md space-y-6"
            {...spekit(SPEKIT.loginForm)}
          >
            <div className="hidden space-y-1 text-center lg:block">
              <h1 className="text-2xl font-black text-foreground">
                {showLinkPanel ? "إكمال الدخول" : "مرحباً بك"}
              </h1>
              <p className="text-sm text-muted-foreground">
                {showLinkPanel
                  ? "أدخل رمز الأستاذ لإتمام الجلسة"
                  : "سجّل دخولك أو أنشئ حساباً جديداً"}
              </p>
            </div>

            <div className="overflow-hidden rounded-3xl border border-border/70 bg-card shadow-xl dark:border-border/50 dark:bg-card/95">
              <div className="h-1 bg-gradient-to-l from-emerald-400 via-emerald-600 to-teal-700" />

              <div className="space-y-5 p-5 sm:p-6">
                {(banner || errorMessage) && !busy ? (
                  <div
                    role="alert"
                    className={cn(
                      "rounded-xl border px-3 py-2.5 text-xs font-semibold leading-snug",
                      errorMessage && !banner
                        ? "border-destructive/25 bg-destructive/5 text-destructive"
                        : "border-emerald-200/80 bg-emerald-50/60 text-emerald-900 dark:border-emerald-900/40 dark:bg-emerald-950/20 dark:text-emerald-100"
                    )}
                  >
                    {errorMessage && !banner ? errorMessage : banner}
                    {errorMessage && banner ? (
                      <p className="mt-1 text-destructive">{errorMessage}</p>
                    ) : null}
                  </div>
                ) : null}

                {!hydrated ? (
                  <div
                    className="flex min-h-[280px] flex-col items-center justify-center gap-3"
                    aria-busy="true"
                  >
                    <Loader2 className="size-5 animate-spin text-emerald-600" />
                    <p className="text-xs text-muted-foreground">
                      جاري التحميل…
                    </p>
                  </div>
                ) : showLinkPanel ? (
                  <form action={linkAction} className={fieldGap}>
                    <PendingWatcher onPendingChange={setBusy} />
                    <p className="text-sm leading-relaxed text-muted-foreground">
                      رقم واتساب موثّق
                      {pendingWhatsapp ? (
                        <>
                          {" "}
                          (<span className="font-mono font-bold" dir="ltr">
                            {pendingWhatsapp}
                          </span>
                          )
                        </>
                      ) : null}
                      . أدخل رمز الأستاذ لإكمال الجلسة.
                    </p>
                    <AuthField
                      id="link_teacher_code"
                      label="رمز الأستاذ"
                      icon={KeyRound}
                      spekitProps={spekit(SPEKIT.loginTeacherCode)}
                    >
                      <div className="relative">
                        <Lock className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                          id="link_teacher_code"
                          name="teacher_code"
                          placeholder="AlMoayed-XXXX"
                          value={linkCode}
                          onChange={(e) => setLinkCode(e.target.value)}
                          className={cn(inputClass, "ps-10 font-mono tracking-wide")}
                          dir="ltr"
                          required
                        />
                      </div>
                    </AuthField>
                    <SubmitButton
                      label="إكمال الدخول"
                      pendingLabel="جاري الربط..."
                      icon={KeyRound}
                      spekitId={SPEKIT.loginSubmit}
                    />
                  </form>
                ) : (
                  <Tabs
                    value={tab}
                    onValueChange={(v) => {
                      if (v) {
                        setTab(v);
                        setBanner(null);
                      }
                    }}
                    className="gap-5"
                  >
                    <TabsList
                      className={cn(
                        "grid h-auto w-full gap-1 rounded-xl border border-border/60 bg-muted/50 p-1 shadow-none",
                        demoEnabled ? "grid-cols-3" : "grid-cols-2"
                      )}
                    >
                      <TabsTrigger value="login" className={tabTriggerClass}>
                        تسجيل الدخول
                      </TabsTrigger>
                      <TabsTrigger value="register" className={tabTriggerClass}>
                        حساب جديد
                      </TabsTrigger>
                      {demoEnabled ? (
                        <TabsTrigger value="demo" className={tabTriggerClass}>
                          حساب تجريبي
                        </TabsTrigger>
                      ) : null}
                    </TabsList>

                    <TabsContent
                      value="login"
                      className="mt-0 data-[hidden]:hidden"
                    >
                      <form action={otpAction} className={fieldGap}>
                        <PendingWatcher
                          onPendingChange={(p) => {
                            setBusy(p);
                            if (p) setOverlay(true);
                          }}
                        />
                        <p className="text-sm leading-relaxed text-muted-foreground">
                          أدخل رقم واتسابك المسجّل — سنحوّلك لخدمة التحقق ثم
                          نفتح جلستك.
                        </p>
                        <WhatsAppField
                          id="login_whatsapp"
                          value={whatsapp}
                          onChange={setWhatsapp}
                          spekitProps={spekit(SPEKIT.loginWhatsappField)}
                        />
                        <SubmitButton
                          label="تسجيل الدخول عبر واتساب"
                          pendingLabel="جاري التحويل..."
                          variant="whatsapp"
                          icon={LogIn}
                          spekitId={SPEKIT.loginOtpCta}
                        />
                      </form>
                    </TabsContent>

                    <TabsContent
                      value="register"
                      className="mt-0 data-[hidden]:hidden"
                    >
                      <form action={registerAction} className={fieldGap}>
                        <PendingWatcher
                          onPendingChange={(p) => {
                            setBusy(p);
                            if (p) setOverlay(true);
                          }}
                        />
                        <AuthField
                          id="full_name"
                          label="اسمك"
                          icon={User}
                          spekitProps={spekit(SPEKIT.loginNameField)}
                        >
                          <div className="relative">
                            <User className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                            <Input
                              id="full_name"
                              name="full_name"
                              placeholder="مثال: أحمد الخطيب"
                              value={fullName}
                              onChange={(e) => setFullName(e.target.value)}
                              className={cn(inputClass, "ps-10")}
                              required
                            />
                          </div>
                        </AuthField>
                        <WhatsAppField
                          id="reg_whatsapp"
                          value={whatsapp}
                          onChange={setWhatsapp}
                          spekitProps={spekit(SPEKIT.loginWhatsappField)}
                        />
                        <AuthField
                          id="teacher_code"
                          label="رمز الأستاذ"
                          icon={KeyRound}
                          spekitProps={spekit(SPEKIT.loginTeacherCode)}
                        >
                          <div className="relative">
                            <Lock className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                            <Input
                              id="teacher_code"
                              name="teacher_code"
                              placeholder="AlMoayed-XXXX"
                              value={teacherCode}
                              onChange={(e) => setTeacherCode(e.target.value)}
                              className={cn(
                                inputClass,
                                "ps-10 font-mono tracking-wide"
                              )}
                              dir="ltr"
                              required
                            />
                          </div>
                        </AuthField>
                        <SubmitButton
                          label="تسجيل والتحقق عبر واتساب"
                          pendingLabel="جاري التسجيل..."
                          icon={User}
                          spekitId={SPEKIT.loginSubmit}
                        />
                      </form>
                    </TabsContent>

                    {demoEnabled ? (
                      <TabsContent
                        value="demo"
                        className="mt-0 data-[hidden]:hidden"
                      >
                        <form
                          ref={demoFormRef}
                          action={demoAction}
                          className="hidden"
                        >
                          <input
                            type="hidden"
                            name="whatsapp_number"
                            value={whatsapp}
                          />
                          <input type="hidden" name="full_name" value={fullName} />
                        </form>
                        <div className={fieldGap}>
                          <p className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                            <FlaskConical className="size-4 shrink-0 text-emerald-600" />
                            حسابات تجريبية للتطوير والعرض
                          </p>
                          <DemoQuickLoginButton
                            title="دخول كطالب تجريبي"
                            subtitle="استكشف لوحة الطالب والاختبارات فوراً"
                            icon={GraduationCap}
                            accent="student"
                            spekitId={SPEKIT.loginDemoStudent}
                            onClick={() =>
                              submitDemo(
                                DEMO_STUDENT.whatsapp_number,
                                DEMO_STUDENT.full_name
                              )
                            }
                          />
                          <DemoQuickLoginButton
                            title="دخول كأستاذ تجريبي"
                            subtitle="جرّب إدارة الطلاب والاختبارات"
                            icon={School}
                            accent="teacher"
                            spekitId={SPEKIT.loginDemoTeacher}
                            onClick={() =>
                              submitDemo(
                                DEMO_TEACHER.whatsapp_number,
                                DEMO_TEACHER.full_name
                              )
                            }
                          />
                        </div>
                      </TabsContent>
                    ) : null}
                  </Tabs>
                )}
              </div>
            </div>

            <p className="text-center text-[11px] leading-snug text-muted-foreground sm:text-xs lg:hidden">
              {APP_FOOTER_COPYRIGHT}
            </p>
          </div>
        </div>
    </>
  );
}
