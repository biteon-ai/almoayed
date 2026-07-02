"use client";

import { useEffect, useRef, useState } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { useRouter } from "next/navigation";
import { loginWithWhatsApp, type LoginState } from "@/actions/auth";
import { APP_NAME, APP_SLOGAN, DEMO_STUDENT } from "@/lib/constants";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Logo } from "@/components/brand/Logo";
import {
  MessageCircle,
  User,
  Loader2,
  ShieldCheck,
  BookOpen,
  Sparkles,
  GraduationCap,
} from "lucide-react";
import { cn } from "@/lib/utils";

const initialState: LoginState | null = null;

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button
      type="submit"
      size="lg"
      className="h-12 w-full gap-2 bg-brand-600 text-base font-semibold shadow-md shadow-brand-900/20 hover:bg-brand-700 active:scale-[0.98]"
      disabled={pending}
    >
      {pending ? (
        <>
          <Loader2 className="size-5 animate-spin" />
          عم يتحقق من حسابك...
        </>
      ) : (
        <>
          <MessageCircle className="size-5" />
          دخول عبر واتساب
        </>
      )}
    </Button>
  );
}

function DemoLoginButton({ onDemoLogin }: { onDemoLogin: () => void }) {
  const { pending } = useFormStatus();
  return (
    <Button
      type="button"
      variant="outline"
      size="lg"
      className="h-11 w-full border-brand-200 bg-white text-brand-700 hover:bg-brand-50"
      onClick={onDemoLogin}
      disabled={pending}
    >
      دخول تجريبي سريع
    </Button>
  );
}

export function LoginForm() {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [state, formAction] = useFormState(loginWithWhatsApp, initialState);
  const [whatsapp, setWhatsapp] = useState("");
  const [fullName, setFullName] = useState("");

  useEffect(() => {
    if (state?.status === "success") {
      router.push("/dashboard");
      router.refresh();
    }
  }, [state, router]);

  const loginAsDemo = () => {
    setWhatsapp(DEMO_STUDENT.whatsapp_number);
    setFullName(DEMO_STUDENT.full_name);
    requestAnimationFrame(() => formRef.current?.requestSubmit());
  };

  return (
    <div className="relative flex min-h-dvh flex-col">
      {/* Background */}
      <div
        className="pointer-events-none absolute inset-0 -z-10 bg-gradient-to-b from-brand-50 via-background to-background"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-0 -z-10 opacity-[0.35]"
        style={{
          backgroundImage: `radial-gradient(circle at 20% 10%, hsl(180 60% 90%) 0%, transparent 45%),
            radial-gradient(circle at 80% 90%, hsl(45 80% 92%) 0%, transparent 40%)`,
        }}
        aria-hidden
      />

      <div className="flex flex-1 flex-col items-center justify-center px-5 py-10">
        {/* Hero */}
        <div className="mb-8 text-center">
          <div className="mb-4 inline-flex items-center gap-1.5 rounded-full border border-brand-200 bg-white/80 px-3 py-1 text-xs font-medium text-brand-700 shadow-sm backdrop-blur-sm">
            <Sparkles className="size-3.5" />
            بكالوريا رياضيات سورية
          </div>
          <Logo size="lg" className="mx-auto mb-3" />
          <p className="text-base font-medium text-brand-800/80">{APP_SLOGAN}</p>
        </div>

        {/* Card */}
        <div className="w-full max-w-sm overflow-hidden rounded-2xl border border-brand-100 bg-white shadow-xl shadow-brand-900/8 ring-1 ring-black/[0.03]">
          <div className="border-b border-brand-50 bg-gradient-to-l from-brand-50/80 to-white px-6 py-5 text-center">
            <h1 className="text-lg font-bold text-foreground">أهلاً فيك</h1>
            <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
              سجّل دخولك برقم واتسابك
              <br />
              <span className="text-xs">ما في إيميل ولا كلمة سر</span>
            </p>
          </div>

          <div className="p-6">
            <form ref={formRef} action={formAction} className="space-y-5">
              {/* WhatsApp number */}
              <div className="space-y-2">
                <Label
                  htmlFor="whatsapp_number"
                  className="text-sm font-semibold text-foreground"
                >
                  رقم واتساب
                </Label>
                <div
                  className={cn(
                    "flex overflow-hidden rounded-xl border bg-white transition-shadow",
                    "focus-within:border-brand-400 focus-within:ring-2 focus-within:ring-brand-500/20",
                    state?.status === "error" && "border-destructive/50"
                  )}
                >
                  <span
                    className="flex shrink-0 items-center gap-1.5 border-e border-input bg-brand-50/60 px-3 text-sm font-medium text-brand-700"
                    dir="ltr"
                  >
                    <MessageCircle className="size-4 text-green-600" />
                    +963
                  </span>
                  <Input
                    id="whatsapp_number"
                    name="whatsapp_number"
                    type="tel"
                    inputMode="numeric"
                    placeholder="9xx xxx xxx"
                    value={whatsapp}
                    onChange={(e) => setWhatsapp(e.target.value)}
                    className="h-12 flex-1 rounded-none border-0 bg-transparent px-3 text-base shadow-none focus-visible:ring-0"
                    dir="ltr"
                    required
                    autoComplete="tel"
                    aria-describedby="phone-hint"
                  />
                </div>
                <p id="phone-hint" className="text-xs leading-relaxed text-muted-foreground">
                  اكتب رقمك السوري كامل مع 963
                  <span className="mx-1 text-foreground/40" dir="ltr">
                    (9639xxxxxxxx)
                  </span>
                </p>
              </div>

              {/* Name */}
              <div className="space-y-2">
                <Label
                  htmlFor="full_name"
                  className="text-sm font-semibold text-foreground"
                >
                  اسمك
                  <span className="me-1 text-xs font-normal text-muted-foreground">
                    (اختياري — للطلاب الجدد)
                  </span>
                </Label>
                <div className="relative">
                  <User className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground/60" />
                  <Input
                    id="full_name"
                    name="full_name"
                    placeholder="مثال: أحمد الخطيب"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="h-12 ps-10 text-base"
                  />
                </div>
              </div>

              {state?.status === "error" && (
                <div
                  role="alert"
                  className="flex items-start gap-2.5 rounded-xl border border-destructive/20 bg-destructive/5 px-3.5 py-3 text-sm text-destructive"
                >
                  <span className="mt-0.5 size-1.5 shrink-0 rounded-full bg-destructive" />
                  {state.message}
                </div>
              )}

              <SubmitButton />

              <div className="rounded-xl border border-dashed border-brand-200 bg-brand-50/40 p-4">
                <div className="mb-3 flex items-center gap-2">
                  <GraduationCap className="size-4 text-brand-600" />
                  <p className="text-sm font-semibold text-brand-800">حساب تجريبي للطلاب</p>
                </div>
                <p className="mb-3 text-xs leading-relaxed text-muted-foreground">
                  جرّب التطبيق فوراً بحساب الطالب{" "}
                  <span className="font-medium text-foreground">
                    {DEMO_STUDENT.full_name}
                  </span>
                  <span className="mt-1 block font-mono text-[11px] text-brand-700" dir="ltr">
                    {DEMO_STUDENT.whatsapp_number}
                  </span>
                </p>
                <DemoLoginButton onDemoLogin={loginAsDemo} />
              </div>
            </form>

            {state?.status === "needs_verification" && (
              <div className="mt-5 space-y-3 rounded-xl border border-amber-200/80 bg-gradient-to-b from-amber-50 to-amber-50/40 p-4">
                <div className="flex items-start gap-2.5">
                  <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-amber-100">
                    <ShieldCheck className="size-4 text-amber-700" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-amber-900">
                      حسابك بانتظار التفعيل
                    </p>
                    <p className="mt-1 text-sm leading-relaxed text-amber-800/80">
                      {state.message}
                    </p>
                  </div>
                </div>
                <a
                  href={state.verificationUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={buttonVariants({
                    size: "lg",
                    className:
                      "h-12 w-full gap-2 bg-[#25D366] text-base font-semibold text-white shadow-md shadow-green-900/15 hover:bg-[#20BD5A]",
                  })}
                >
                  <MessageCircle className="size-5" />
                  أرسل طلب التفعيل عبر واتساب
                </a>
              </div>
            )}
          </div>
        </div>

        {/* Trust strip */}
        <div className="mt-8 flex max-w-sm flex-wrap items-center justify-center gap-x-5 gap-y-2 text-xs text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <BookOpen className="size-3.5 text-brand-500" />
            اختبارات بكالوريا
          </span>
          <span className="size-1 rounded-full bg-border" />
          <span className="flex items-center gap-1.5">
            <ShieldCheck className="size-3.5 text-brand-500" />
            حلول مقفولة لحد التسليم
          </span>
        </div>

        <p className="mt-5 max-w-xs text-center text-xs leading-relaxed text-muted-foreground/80">
          {APP_NAME} — منصة رياضيات البكالوريا السورية.
          <br />
          حلّ بإيدك قبل ما تشوف الحل.
        </p>
      </div>
    </div>
  );
}
