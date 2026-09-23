"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { useRouter, useSearchParams } from "next/navigation";
import {
  registerStudentAndRequestOTP,
  loginDemoAccount,
  linkTeacherCodeAction,
} from "@/actions/login";
import { startBiteonSwitchOtp } from "@/actions/biteonswitch";
import { FixedOtpStep } from "@/components/login/FixedOtpStep";
import type { LoginState } from "@/types/auth";
import type { StartOtpState } from "@/actions/biteonswitch";
import {
  loginMessageForCode,
  loginMessageForQueryError,
} from "@/lib/login-ui-messages";
import { DEMO_STUDENT, DEMO_TEACHER, APP_FOOTER_COPYRIGHT } from "@/lib/constants";
import { navigateAfterLogin } from "@/lib/post-login-navigation";
import { AppVersion } from "@/components/brand/AppVersion";
import { AuthField, AuthInputShell } from "@/components/login/AuthField";
import { LoginLoadingOverlay } from "@/components/login/LoginLoadingOverlay";
import { PwaInstallPrompt } from "@/components/pwa/PwaInstallPrompt";
import { useLoadingBarSync } from "@/components/providers/top-loader-provider";
import {
  ActiveLoginLoaderBar,
  startTopNavLoader,
} from "@/components/ui/top-loader";
import { Button } from "@/components/ui/button";
import { buttonVariants } from "@/components/ui/button-variants";
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
  forceDisabled = false,
}: {
  label: string;
  pendingLabel: string;
  variant?: "brand" | "whatsapp" | "secondary";
  spekitId?: string;
  icon: React.ElementType;
  /** AUTH-006: disable when any other login action is in flight. */
  forceDisabled?: boolean;
}) {
  const { pending } = useFormStatus();
  const disabled = pending || forceDisabled;
  return (
    <Button
      type="submit"
      variant={variant}
      size="default"
      className={touchBtnClass}
      disabled={disabled}
      aria-busy={pending}
      data-spekit={spekitId}
    >
      {pending ? (
        <>
          <Loader2 className="size-4 animate-spin" aria-hidden />
          {pendingLabel}
        </>
      ) : (
        <>
          <Icon className="size-4" aria-hidden />
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
  disabled = false,
  pending = false,
}: {
  title: string;
  subtitle: string;
  icon: React.ElementType;
  accent: "student" | "teacher";
  onClick: () => void;
  spekitId?: string;
  disabled?: boolean;
  pending?: boolean;
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
      disabled={disabled}
      aria-busy={pending}
      className={cn(
        "group flex w-full items-center gap-4 rounded-2xl border-2 p-4 text-start transition-all duration-300",
        styles.card,
        disabled && "pointer-events-none opacity-60"
      )}
    >
      <div
        className={cn(
          "flex h-12 w-12 shrink-0 items-center justify-center rounded-xl transition-transform duration-300 group-hover:scale-105",
          styles.icon
        )}
      >
        {pending ? (
          <Loader2 className="h-6 w-6 animate-spin" aria-hidden />
        ) : (
          <Icon className="h-6 w-6" aria-hidden />
        )}
      </div>
      <div className="min-w-0 flex-1 space-y-0.5">
        <p className="font-bold text-foreground">
          {pending ? "جاري الدخول..." : title}
        </p>
        <p className="text-xs leading-relaxed text-muted-foreground">
          {pending ? "لحظات ويكتمل التحقق من الحساب التجريبي" : subtitle}
        </p>
      </div>
      {pending ? (
        <Loader2 className="h-4 w-4 shrink-0 animate-spin text-muted-foreground" aria-hidden />
      ) : (
        <ChevronLeft className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:-translate-x-0.5" aria-hidden />
      )}
    </button>
  );
}

type LoginFormProps = {
  demoEnabled: boolean;
  fixedOtpEnabled: boolean;
  needsTeacherLink: boolean;
  pendingWhatsapp: string;
  biteonHostedLoginHref: string;
};

export function LoginForm({
  demoEnabled,
  fixedOtpEnabled,
  needsTeacherLink,
  pendingWhatsapp,
  biteonHostedLoginHref,
}: LoginFormProps) {
  const router = useRouter();
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
  const [demoPending, setDemoPending] = useState<"student" | "teacher" | null>(
    null
  );
  const [fixedOtp, setFixedOtp] = useState<{
    stateId: string;
    whatsapp: string;
  } | null>(null);
  const [banner, setBanner] = useState<string | null>(
    needsTeacherLink || needsTeacherQuery
      ? "تم التحقق من واتساب. أدخل رمز الأستاذ لإكمال الدخول."
      : null
  );
  const [hydrated, setHydrated] = useState(false);
  const [, startTransition] = useTransition();

  const isBusy = busy || overlay || demoPending !== null;

  // Keep global NProgress ticking; ActiveLoginLoaderBar provides visible trickle + Spekit.
  useLoadingBarSync(isBusy);

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

  // Hosted Login returns `#access_token=…` — browsers never send hash to the server.
  // Forward token to the session callback so iron-session can be minted.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const hash = window.location.hash.replace(/^#/, "");
    if (!hash) return;
    const params = new URLSearchParams(hash);
    const token =
      params.get("access_token") ||
      params.get("biteon_token") ||
      params.get("verification_token");
    if (!token) return;

    startTopNavLoader();
    setBusy(true);
    setOverlay(true);
    const callback = new URL(
      "/api/auth/biteonswitch/callback",
      window.location.origin
    );
    callback.searchParams.set("token", token);
    // Drop hash so a refresh does not re-fire the handoff.
    window.history.replaceState(null, "", window.location.pathname + window.location.search);
    window.location.assign(callback.toString());
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
    if (otpState?.status === "fixed_otp_required") {
      setBusy(false);
      setOverlay(false);
      setFixedOtp({ stateId: otpState.stateId, whatsapp });
    }
  }, [otpState, whatsapp]);

  useEffect(() => {
    if (registerState?.status === "redirect") {
      setOverlay(true);
      window.location.assign(registerState.redirectUrl);
      return;
    }
    if (registerState?.status === "fixed_otp_required") {
      setBusy(false);
      setOverlay(false);
      setFixedOtp({ stateId: registerState.stateId, whatsapp });
      return;
    }
    if (registerState?.status === "already_registered") {
      setBanner(loginMessageForCode("ALREADY_REGISTERED"));
      setTab("login");
      setBusy(false);
      setOverlay(false);
      setDemoPending(null);
      return;
    }
    if (registerState?.status === "error") {
      setBusy(false);
      setOverlay(false);
      setDemoPending(null);
    }
  }, [registerState, whatsapp]);

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
      navigateAfterLogin(router, role);
      return;
    }
    if (demoState?.status === "error" || linkState?.status === "error") {
      setBusy(false);
      setOverlay(false);
      setDemoPending(null);
    }
  }, [demoState, linkState, router]);

  useEffect(() => {
    if (otpState?.status === "error") {
      setBusy(false);
      setOverlay(false);
      setDemoPending(null);
    }
  }, [otpState]);

  const errorMessage =
    (registerState?.status === "error" &&
      loginMessageForCode(registerState.code)) ||
    (otpState?.status === "error" && loginMessageForCode(otpState.code)) ||
    (demoState?.status === "error" && loginMessageForCode(demoState.code)) ||
    (linkState?.status === "error" && loginMessageForCode(linkState.code)) ||
    queryError;

  const markPending = (pending: boolean) => {
    setBusy(pending);
    if (pending) {
      setOverlay(true);
      startTopNavLoader();
    }
  };

  const submitDemo = (
    number: string,
    name: string,
    which: "student" | "teacher"
  ) => {
    if (isBusy) return;
    startTopNavLoader();
    setDemoPending(which);
    setBusy(true);
    setOverlay(true);
    setWhatsapp(number);
    setFullName(name);
    const fd = new FormData();
    fd.set("whatsapp_number", number);
    fd.set("full_name", name);
    startTransition(() => {
      demoAction(fd);
    });
  };

  const showLinkPanel = needsTeacherLink || needsTeacherQuery;

  return (
    <>
      <ActiveLoginLoaderBar active={isBusy} />
      <LoginLoadingOverlay
        show={overlay}
        message={
          demoPending
            ? "جاري الدخول التجريبي…"
            : busy
              ? "جاري التحقق…"
              : "جاري المتابعة…"
        }
        subMessage="لحظة من فضلك…"
      />

      <div
        className={cn(
          "flex flex-1 items-center justify-center px-4 py-6 sm:px-6 sm:py-8",
          overlay && "pointer-events-none opacity-40"
        )}
        aria-busy={isBusy}
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
                {(banner || errorMessage) && !isBusy ? (
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
                ) : fixedOtp ? (
                  <FixedOtpStep
                    stateId={fixedOtp.stateId}
                    whatsapp={fixedOtp.whatsapp}
                    onSuccess={(role) => {
                      setOverlay(true);
                      navigateAfterLogin(router, role);
                    }}
                  />
                ) : showLinkPanel ? (
                  <form
                    action={linkAction}
                    className={fieldGap}
                    onSubmit={() => {
                      startTopNavLoader();
                      setBusy(true);
                      setOverlay(true);
                    }}
                  >
                    <PendingWatcher onPendingChange={markPending} />
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
                          disabled={isBusy}
                        />
                      </div>
                    </AuthField>
                    <SubmitButton
                      label="إكمال الدخول"
                      pendingLabel="جاري الربط..."
                      icon={KeyRound}
                      spekitId={SPEKIT.loginSubmit}
                      forceDisabled={isBusy}
                    />
                  </form>
                ) : (
                  <Tabs
                    value={tab}
                    onValueChange={(v) => {
                      if (isBusy) return;
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
                        demoEnabled ? "grid-cols-3" : "grid-cols-2",
                        isBusy && "pointer-events-none opacity-70"
                      )}
                    >
                      <TabsTrigger
                        value="login"
                        className={tabTriggerClass}
                        disabled={isBusy}
                      >
                        تسجيل الدخول
                      </TabsTrigger>
                      <TabsTrigger
                        value="register"
                        className={tabTriggerClass}
                        disabled={isBusy}
                      >
                        حساب جديد
                      </TabsTrigger>
                      {demoEnabled ? (
                        <TabsTrigger
                          value="demo"
                          className={tabTriggerClass}
                          disabled={isBusy}
                        >
                          حساب تجريبي
                        </TabsTrigger>
                      ) : null}
                    </TabsList>

                    <TabsContent
                      value="login"
                      className="mt-0 data-[hidden]:hidden"
                    >
                      {fixedOtpEnabled ? (
                        <form
                          action={otpAction}
                          className={fieldGap}
                          onSubmit={() => {
                            startTopNavLoader();
                            setBusy(true);
                            setOverlay(true);
                          }}
                        >
                          <PendingWatcher onPendingChange={markPending} />
                          <WhatsAppField
                            id="login_whatsapp"
                            value={whatsapp}
                            onChange={setWhatsapp}
                            spekitProps={spekit(SPEKIT.loginWhatsappField)}
                          />
                          <SubmitButton
                            label="إرسال رمز التحقق"
                            pendingLabel="جاري الإرسال..."
                            icon={LogIn}
                            spekitId={SPEKIT.loginOtpCta}
                            forceDisabled={isBusy}
                          />
                        </form>
                      ) : (
                      <div className={fieldGap}>
                        <p className="text-sm leading-relaxed text-muted-foreground">
                          سجّل الدخول عبر واتساب على صفحة التحقق — ثم نعيدك
                          إلى المنصة.
                        </p>
                        <a
                          href={biteonHostedLoginHref}
                          className={cn(
                            buttonVariants({ variant: "whatsapp", size: "default" }),
                            touchBtnClass,
                            isBusy && "pointer-events-none opacity-70"
                          )}
                          data-spekit={SPEKIT.loginOtpCta}
                          onClick={() => {
                            startTopNavLoader();
                            setBusy(true);
                            setOverlay(true);
                          }}
                        >
                          <LogIn className="size-4" aria-hidden />
                          تسجيل الدخول عبر واتساب
                        </a>
                      </div>
                      )}
                    </TabsContent>

                    <TabsContent
                      value="register"
                      className="mt-0 data-[hidden]:hidden"
                    >
                      <form
                        action={registerAction}
                        className={fieldGap}
                        onSubmit={() => {
                          startTopNavLoader();
                          setBusy(true);
                          setOverlay(true);
                        }}
                      >
                        <PendingWatcher onPendingChange={markPending} />
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
                              disabled={isBusy}
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
                              disabled={isBusy}
                            />
                          </div>
                        </AuthField>
                        <SubmitButton
                          label="تسجيل والتحقق عبر واتساب"
                          pendingLabel="جاري التسجيل..."
                          icon={User}
                          spekitId={SPEKIT.loginSubmit}
                          forceDisabled={isBusy}
                        />
                      </form>
                    </TabsContent>

                    {demoEnabled ? (
                      <TabsContent
                        value="demo"
                        className="mt-0 data-[hidden]:hidden"
                      >
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
                            disabled={isBusy}
                            pending={demoPending === "student"}
                            onClick={() =>
                              submitDemo(
                                DEMO_STUDENT.whatsapp_number,
                                DEMO_STUDENT.full_name,
                                "student"
                              )
                            }
                          />
                          <DemoQuickLoginButton
                            title="دخول كأستاذ تجريبي"
                            subtitle="جرّب إدارة الطلاب والاختبارات"
                            icon={School}
                            accent="teacher"
                            spekitId={SPEKIT.loginDemoTeacher}
                            disabled={isBusy}
                            pending={demoPending === "teacher"}
                            onClick={() =>
                              submitDemo(
                                DEMO_TEACHER.whatsapp_number,
                                DEMO_TEACHER.full_name,
                                "teacher"
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

            <PwaInstallPrompt />

            <div className="flex flex-col items-center gap-1 text-center lg:hidden">
              <p className="text-[11px] leading-snug text-muted-foreground sm:text-xs">
                {APP_FOOTER_COPYRIGHT}
              </p>
              <AppVersion />
            </div>
          </div>
        </div>
    </>
  );
}
