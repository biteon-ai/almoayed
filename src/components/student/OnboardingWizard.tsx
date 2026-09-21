"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { completeStudentOnboarding } from "@/actions/profile";
import {
  ONBOARDING_STAGE_OPTIONS,
  PRIMARY_SUBJECT_PRESETS,
  REFERRAL_SOURCE_LABELS,
  REFERRAL_SOURCES,
} from "@/lib/student-profile";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SPEKIT, spekit } from "@/lib/spekit-targets";
import { choiceChipClass } from "@/lib/ui-chrome";
import { Loader2 } from "lucide-react";

export function OnboardingWizard() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [educationStage, setEducationStage] = useState("");
  const [referralSource, setReferralSource] = useState("");
  const [primarySubject, setPrimarySubject] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const next = () => {
    setError(null);
    if (step === 0 && !educationStage) {
      setError("اختر المرحلة الدراسية");
      return;
    }
    if (step === 1 && !referralSource) {
      setError("اختر كيف حصلت على الكود");
      return;
    }
    if (step < 2) {
      setStep((s) => s + 1);
      return;
    }
    startTransition(async () => {
      const result = await completeStudentOnboarding({
        educationStage,
        referralSource,
        primarySubject,
      });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      router.replace("/dashboard");
      router.refresh();
    });
  };

  return (
    <div
      className="space-y-5 rounded-2xl border bg-card p-5 shadow-sm"
      {...spekit(SPEKIT.studentOnboarding)}
    >
      <div>
        <p className="text-xs font-medium text-muted-foreground">
          خطوة {step + 1} من 3
        </p>
        <h1 className="mt-1 text-xl font-bold">مرحباً في المؤيد</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          أسئلة سريعة لنخصّص تجربتك.
        </p>
      </div>

      {step === 0 ? (
        <div className="space-y-3">
          <p className="text-sm font-semibold">ما مرحلتك الدراسية؟</p>
          <div className="grid gap-2.5">
            {ONBOARDING_STAGE_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setEducationStage(opt.value)}
                className={choiceChipClass(
                  educationStage === opt.value,
                  "h-12 w-full px-4 text-start text-sm"
                )}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      ) : null}

      {step === 1 ? (
        <div className="space-y-3">
          <p className="text-sm font-semibold">كيف حصلت على كود الأستاذ؟</p>
          <div className="grid gap-2.5">
            {REFERRAL_SOURCES.map((src) => (
              <button
                key={src}
                type="button"
                onClick={() => setReferralSource(src)}
                className={choiceChipClass(
                  referralSource === src,
                  "h-12 w-full px-4 text-start text-sm"
                )}
              >
                {REFERRAL_SOURCE_LABELS[src]}
              </button>
            ))}
          </div>
        </div>
      ) : null}

      {step === 2 ? (
        <div className="space-y-3">
          <p className="text-sm font-semibold">ما مادتك الرئيسية مع هذا الأستاذ؟</p>
          <div className="flex flex-wrap gap-2.5">
            {PRIMARY_SUBJECT_PRESETS.map((subject) => (
              <button
                key={subject}
                type="button"
                onClick={() => setPrimarySubject(subject)}
                className={choiceChipClass(
                  primarySubject === subject,
                  "h-10 rounded-full px-3 text-xs font-bold"
                )}
              >
                {subject}
              </button>
            ))}
          </div>
          <Input
            className="h-11"
            placeholder="أو اكتب المادة…"
            value={primarySubject}
            onChange={(e) => setPrimarySubject(e.target.value)}
          />
        </div>
      ) : null}

      {error ? (
        <p className="text-sm font-medium text-destructive" role="alert">
          {error}
        </p>
      ) : null}

      <div className="flex gap-2">
        {step > 0 ? (
          <Button
            type="button"
            variant="outline"
            className="h-11 flex-1"
            disabled={pending}
            onClick={() => {
              setError(null);
              setStep((s) => s - 1);
            }}
          >
            رجوع
          </Button>
        ) : null}
        <Button
          type="button"
          className="h-11 flex-1"
          disabled={pending}
          onClick={next}
        >
          {pending ? <Loader2 className="size-4 animate-spin" /> : null}
          {step === 2 ? "إنهاء" : "التالي"}
        </Button>
      </div>
    </div>
  );
}
