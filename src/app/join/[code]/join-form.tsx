"use client";

import { useEffect, useState } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { useRouter } from "next/navigation";
import { joinTrialStudent, type JoinState } from "@/actions/join";
import { FixedOtpStep } from "@/components/login/FixedOtpStep";
import { AuthField, AuthInputShell } from "@/components/login/AuthField";
import { LoginPageShell } from "@/app/login/login-page-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  EDUCATION_STAGES,
  EDUCATION_STAGE_LABELS,
} from "@/lib/student-profile";
import { TRIAL_JOIN_MESSAGES } from "@/lib/trial-join-messages";
import { SPEKIT, spekit } from "@/lib/spekit-targets";
import { cn } from "@/lib/utils";
import { GraduationCap, Loader2, MessageCircle, User } from "lucide-react";

const initialState: JoinState | null = null;

function JoinSubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button
      type="submit"
      variant="brand"
      className="h-12 w-full gap-2 rounded-xl text-sm font-bold"
      disabled={pending}
      aria-busy={pending}
      {...spekit(SPEKIT.joinSubmit)}
    >
      {pending ? (
        <>
          <Loader2 className="size-4 animate-spin" aria-hidden />
          جاري الانضمام…
        </>
      ) : (
        "ابدأ التجربة"
      )}
    </Button>
  );
}

const inputClass =
  "h-12 w-full rounded-xl border-input bg-muted/40 px-4 text-sm transition-all duration-200 placeholder:text-xs focus:border-emerald-500 focus:bg-background focus-visible:ring-[3px] focus-visible:ring-emerald-500/15 focus-visible:ring-offset-0";

interface JoinFormProps {
  teacherCode: string;
  teacherName: string;
}

export function JoinForm({ teacherCode, teacherName }: JoinFormProps) {
  const router = useRouter();
  const [state, formAction] = useFormState(joinTrialStudent, initialState);
  const [whatsapp, setWhatsapp] = useState("");
  const [educationStage, setEducationStage] = useState("");
  const [clientError, setClientError] = useState<string | null>(null);

  useEffect(() => {
    if (!state) return;
    if (state.status === "success") {
      router.replace("/dashboard");
      router.refresh();
      return;
    }
    if (state.status === "redirect") {
      window.location.href = state.redirectUrl;
    }
  }, [state, router]);

  const errorMessage =
    clientError ??
    (state?.status === "error"
      ? state.message ??
        (state.code === "INVALID_TEACHER_CODE"
          ? TRIAL_JOIN_MESSAGES.invalidLink
          : state.code === "ACCOUNT_INACTIVE"
            ? TRIAL_JOIN_MESSAGES.inactiveTeacher
            : state.code === "LOGIN_UNEXPECTED"
              ? TRIAL_JOIN_MESSAGES.teacherWhatsapp
              : TRIAL_JOIN_MESSAGES.existingNeedsOtp)
      : null);

  return (
    <LoginPageShell>
      <div className="flex flex-1 flex-col justify-center px-4 py-8 sm:px-8">
        {state?.status === "fixed_otp_required" ? (
          <div className="mx-auto w-full max-w-md space-y-5">
            <h1 className="text-xl font-bold">تأكيد رقم واتساب</h1>
            <FixedOtpStep
              stateId={state.stateId}
              whatsapp={state.whatsapp}
              onSuccess={() => {
                router.replace("/dashboard");
                router.refresh();
              }}
            />
          </div>
        ) : (
        <form
          action={formAction}
          className="mx-auto w-full max-w-md space-y-5"
          {...spekit(SPEKIT.joinForm)}
          onSubmit={(e) => {
            if (!educationStage) {
              e.preventDefault();
              setClientError("اختر المرحلة الدراسية");
            } else {
              setClientError(null);
            }
          }}
        >
          <input type="hidden" name="teacher_code" value={teacherCode} />
          <input type="hidden" name="education_stage" value={educationStage} />
          <div className="space-y-1 text-start">
            <h1 className="text-xl font-bold">انضم لصف {teacherName}</h1>
            <p className="text-sm text-muted-foreground">
              أدخل بياناتك للبدء مباشرة — بدون رمز تحقق في أول مرة.
            </p>
          </div>

          {errorMessage ? (
            <p
              className="rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive"
              role="alert"
            >
              {errorMessage}
            </p>
          ) : null}

          <div className="grid gap-4 sm:grid-cols-2">
            <AuthField
              id="first_name"
              label="الاسم الأول"
              icon={User}
              spekitProps={spekit(SPEKIT.joinFirstName)}
            >
              <Input
                id="first_name"
                name="first_name"
                required
                className={inputClass}
                autoComplete="given-name"
              />
            </AuthField>
            <AuthField
              id="last_name"
              label="الكنية"
              icon={User}
              spekitProps={spekit(SPEKIT.joinLastName)}
            >
              <Input
                id="last_name"
                name="last_name"
                required
                className={inputClass}
                autoComplete="family-name"
              />
            </AuthField>
          </div>

          <div className="space-y-2" {...spekit(SPEKIT.joinClassLevel)}>
            <p className="text-sm font-semibold">المرحلة الدراسية</p>
            <div className="grid gap-2">
              {EDUCATION_STAGES.map((stage) => (
                <button
                  key={stage}
                  type="button"
                  onClick={() => setEducationStage(stage)}
                  className={cn(
                    "h-12 rounded-xl border px-4 text-start text-sm font-semibold",
                    educationStage === stage
                      ? "border-emerald-600 bg-emerald-50 text-emerald-900"
                      : "border-border bg-muted/30"
                  )}
                >
                  {EDUCATION_STAGE_LABELS[stage]}
                </button>
              ))}
            </div>
          </div>

          <AuthField
            id="birth_date"
            label="تاريخ الميلاد"
            icon={GraduationCap}
            spekitProps={spekit(SPEKIT.joinBirthDate)}
          >
            <Input
              id="birth_date"
              name="birth_date"
              type="date"
              required
              className={inputClass}
            />
          </AuthField>

          <AuthField
            id="join_whatsapp"
            label="رقم واتساب"
            icon={MessageCircle}
            spekitProps={spekit(SPEKIT.joinWhatsapp)}
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
                id="join_whatsapp"
                name="whatsapp_number"
                type="tel"
                inputMode="numeric"
                autoComplete="tel"
                placeholder="9xx xxx xxx"
                value={whatsapp}
                onChange={(e) => setWhatsapp(e.target.value)}
                className="min-w-0 flex-1 bg-transparent px-3 text-sm outline-none placeholder:text-xs"
                dir="ltr"
                required
                suppressHydrationWarning
              />
            </AuthInputShell>
          </AuthField>

          <JoinSubmitButton />
        </form>
        )}
      </div>
    </LoginPageShell>
  );
}
