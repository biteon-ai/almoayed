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
import { DEMO_STUDENT, DEMO_TEACHER } from "@/lib/constants";
import { MobileShell } from "@/components/layout/MobileShell";
import { LoginLoadingOverlay } from "@/components/login/LoginLoadingOverlay";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { BrandHeader } from "@/components/brand/BrandHeader";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  MessageCircle,
  User,
  Loader2,
  GraduationCap,
  School,
  Key,
  LogIn,
  FlaskConical,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { SPEKIT, spekit } from "@/lib/spekit-targets";

const initialLogin: LoginState | null = null;
const initialOtp: StartOtpState | null = null;

const fieldGap = "space-y-2.5";
const labelClass =
  "flex items-center gap-1.5 text-xs font-medium text-slate-700 dark:text-slate-300";
const inputClass =
  "h-10 px-3 text-sm placeholder:text-xs";

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
      className="h-10 w-full gap-2 text-sm font-semibold sm:h-11"
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
    <div className="space-y-1" {...spekitProps}>
      <Label htmlFor={id} className={labelClass}>
        <MessageCircle className="size-3.5 shrink-0 text-brand-600" />
        رقم واتساب
      </Label>
      <div className="input-touch-group h-10 items-stretch">
        <span
          className="input-touch-prefix !gap-1 !px-2 !text-xs !font-semibold"
          dir="ltr"
        >
          <span className="size-1.5 shrink-0 rounded-full bg-[#25D366]" />
          +963
        </span>
        <Input
          id={id}
          name="whatsapp_number"
          type="tel"
          inputMode="numeric"
          autoComplete="tel"
          placeholder="9xx xxx xxx"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={cn(
            inputClass,
            "min-w-0 flex-1 rounded-none border-0 bg-transparent shadow-none focus-visible:ring-0"
          )}
          dir="ltr"
          required
        />
      </div>
    </div>
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
    setTab(defaultTab);
  }, [defaultTab]);

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
  const tabCols = demoEnabled ? "grid-cols-3" : "grid-cols-2";

  return (
    <MobileShell
      noPadding
      className="max-w-none items-center justify-center overflow-x-hidden bg-gradient-to-b from-slate-50 via-background to-background p-3 dark:from-slate-950 dark:via-background sm:p-6"
    >
      <LoginLoadingOverlay
        show={overlay}
        message="جاري المتابعة…"
        subMessage="لحظة من فضلك…"
      />

      <div
        className={cn(
          "relative flex w-full max-w-md flex-col items-stretch justify-center gap-2 xs:gap-2.5",
          overlay && "pointer-events-none opacity-40"
        )}
      >
        <BrandHeader compact showSlogan={false} />

        <div
          className="card-native glow-teal w-full overflow-hidden"
          {...spekit(SPEKIT.loginForm)}
        >
          <div className="h-0.5 bg-gradient-to-l from-brand-400 via-brand-600 to-brand-800 sm:h-1" />

          <div className="space-y-2.5 p-3 xs:p-3.5 sm:space-y-3 sm:p-4">
            {(banner || errorMessage) && !busy && (
              <div
                role="alert"
                className={cn(
                  "rounded-lg border px-2.5 py-1.5 text-[11px] font-semibold leading-snug xs:text-xs",
                  errorMessage && !banner
                    ? "border-destructive/25 bg-destructive/5 text-destructive"
                    : "border-brand-200/80 bg-brand-50/60 text-brand-900 dark:border-brand-900/40 dark:bg-brand-950/20 dark:text-brand-100"
                )}
              >
                {errorMessage && !banner ? errorMessage : banner}
                {errorMessage && banner ? (
                  <p className="mt-1 text-destructive">{errorMessage}</p>
                ) : null}
              </div>
            )}

            {showLinkPanel ? (
              <form action={linkAction} className={fieldGap}>
                <PendingWatcher onPendingChange={setBusy} />
                <p className="text-[11px] leading-snug text-muted-foreground xs:text-xs">
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
                <div className="space-y-1" {...spekit(SPEKIT.loginTeacherCode)}>
                  <Label htmlFor="link_teacher_code" className={labelClass}>
                    <Key className="size-3.5 shrink-0 text-brand-600" />
                    رمز الأستاذ
                  </Label>
                  <Input
                    id="link_teacher_code"
                    name="teacher_code"
                    placeholder="AlMoayed-XXXX"
                    value={linkCode}
                    onChange={(e) => setLinkCode(e.target.value)}
                    className={cn(inputClass, "font-mono tracking-wide")}
                    dir="ltr"
                    required
                  />
                </div>
                <SubmitButton
                  label="إكمال الدخول"
                  pendingLabel="جاري الربط..."
                  icon={Key}
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
                className="gap-2.5 sm:gap-3"
              >
                <TabsList
                  className={cn(
                    "grid h-auto w-full gap-1 rounded-xl p-1",
                    tabCols
                  )}
                >
                  <TabsTrigger
                    value="register"
                    className="h-auto min-h-9 whitespace-normal px-1 py-1.5 text-[10px] font-bold leading-tight xs:text-xs sm:text-sm data-[active]:shadow-sm"
                  >
                    تسجيل جديد
                  </TabsTrigger>
                  <TabsTrigger
                    value="login"
                    className="h-auto min-h-9 whitespace-normal px-1 py-1.5 text-[10px] font-bold leading-tight xs:text-xs sm:text-sm data-[active]:shadow-sm"
                  >
                    دخول
                  </TabsTrigger>
                  {demoEnabled && (
                    <TabsTrigger
                      value="demo"
                      className="h-auto min-h-9 whitespace-normal px-1 py-1.5 text-[10px] font-bold leading-tight xs:text-xs sm:text-sm data-[active]:shadow-sm"
                    >
                      تجربة
                    </TabsTrigger>
                  )}
                </TabsList>

                <TabsContent value="register" className="mt-0">
                  <form action={registerAction} className={fieldGap}>
                    <PendingWatcher
                      onPendingChange={(p) => {
                        setBusy(p);
                        if (p) setOverlay(true);
                      }}
                    />
                    <div
                      className="space-y-1"
                      {...spekit(SPEKIT.loginNameField)}
                    >
                      <Label htmlFor="full_name" className={labelClass}>
                        <User className="size-3.5 shrink-0 text-brand-600" />
                        اسمك
                      </Label>
                      <Input
                        id="full_name"
                        name="full_name"
                        placeholder="مثال: أحمد الخطيب"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        className={inputClass}
                        required
                      />
                    </div>
                    <WhatsAppField
                      id="reg_whatsapp"
                      value={whatsapp}
                      onChange={setWhatsapp}
                      spekitProps={spekit(SPEKIT.loginWhatsappField)}
                    />
                    <div
                      className="space-y-1"
                      {...spekit(SPEKIT.loginTeacherCode)}
                    >
                      <Label htmlFor="teacher_code" className={labelClass}>
                        <Key className="size-3.5 shrink-0 text-brand-600" />
                        رمز الأستاذ
                      </Label>
                      <Input
                        id="teacher_code"
                        name="teacher_code"
                        placeholder="AlMoayed-XXXX"
                        value={teacherCode}
                        onChange={(e) => setTeacherCode(e.target.value)}
                        className={cn(inputClass, "font-mono tracking-wide")}
                        dir="ltr"
                        required
                      />
                    </div>
                    <SubmitButton
                      label="تسجيل والتحقق عبر واتساب"
                      pendingLabel="جاري التسجيل..."
                      icon={User}
                      spekitId={SPEKIT.loginSubmit}
                    />
                  </form>
                </TabsContent>

                <TabsContent value="login" className="mt-0">
                  <form action={otpAction} className={fieldGap}>
                    <PendingWatcher
                      onPendingChange={(p) => {
                        setBusy(p);
                        if (p) setOverlay(true);
                      }}
                    />
                    <p className="text-[11px] leading-snug text-muted-foreground xs:text-xs">
                      أدخل رقم واتسابك المسجّل — سنحوّلك لخدمة التحقق ثم نفتح
                      جلستك.
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

                {demoEnabled && (
                  <TabsContent value="demo" className="mt-0">
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
                      <p className="flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground xs:text-xs">
                        <FlaskConical className="size-3.5 shrink-0" />
                        حسابات تجريبية للتطوير والعرض
                      </p>
                      <div {...spekit(SPEKIT.loginDemoStudent)}>
                        <Button
                          type="button"
                          variant="secondary"
                          size="default"
                          className="h-10 w-full gap-2 text-sm font-semibold sm:h-11"
                          onClick={() =>
                            submitDemo(
                              DEMO_STUDENT.whatsapp_number,
                              DEMO_STUDENT.full_name
                            )
                          }
                        >
                          <GraduationCap className="size-4" />
                          دخول تجريبي — طالب
                        </Button>
                      </div>
                      <div {...spekit(SPEKIT.loginDemoTeacher)}>
                        <Button
                          type="button"
                          variant="secondary"
                          size="default"
                          className="h-10 w-full gap-2 text-sm font-semibold sm:h-11"
                          onClick={() =>
                            submitDemo(
                              DEMO_TEACHER.whatsapp_number,
                              DEMO_TEACHER.full_name
                            )
                          }
                        >
                          <School className="size-4" />
                          دخول تجريبي — أستاذ
                        </Button>
                      </div>
                    </div>
                  </TabsContent>
                )}
              </Tabs>
            )}
          </div>
        </div>
      </div>
    </MobileShell>
  );
}
