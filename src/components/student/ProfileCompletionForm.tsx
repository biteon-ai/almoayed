"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { completeRequiredStudentProfile } from "@/actions/profile";
import {
  StudentDemographicsFields,
  birthPartsToIso,
  isoToBirthParts,
  type DemographicsFormValues,
} from "@/components/student/StudentDemographicsFields";
import { Button } from "@/components/ui/button";
import { SPEKIT, spekit } from "@/lib/spekit-targets";
import type { StudentDemographics } from "@/types/database";
import { Loader2 } from "lucide-react";
import Link from "next/link";

interface ProfileCompletionFormProps {
  fullName: string;
  demographics: StudentDemographics;
  fromPath: string;
}

export function ProfileCompletionForm({
  fullName,
  demographics,
  fromPath,
}: ProfileCompletionFormProps) {
  const router = useRouter();
  const birth = isoToBirthParts(demographics.birthDate);
  const [values, setValues] = useState<DemographicsFormValues>({
    fullName,
    birthYear: birth.year,
    birthMonth: birth.month,
    birthDay: birth.day,
    province: demographics.province ?? "",
    city: demographics.city ?? "",
    educationStage: demographics.educationStage ?? "",
    email: demographics.email ?? "",
    address: demographics.address ?? "",
  });
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const onSubmit = () => {
    setError(null);
    startTransition(async () => {
      const result = await completeRequiredStudentProfile({
        fullName: values.fullName,
        birthDate: birthPartsToIso(
          values.birthYear,
          values.birthMonth,
          values.birthDay
        ),
        province: values.province,
        city: values.city,
        educationStage: values.educationStage,
        email: values.email,
        address: values.address,
        from: fromPath,
      });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      router.replace(result.data?.redirectTo ?? "/dashboard");
      router.refresh();
    });
  };

  return (
    <div
      className="space-y-5 rounded-2xl border bg-card p-5 shadow-sm"
      {...spekit(SPEKIT.profileCompletionModal)}
    >
      <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-900 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-100">
        بقي خطوة واحدة لاستكمال حسابك ومتابعة الاختبارات 🚀
      </div>

      <div>
        <h1 className="text-xl font-bold">استكمال الملف الشخصي</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          أكمل البيانات المطلوبة لتفتح الاختبارات الجديدة.
        </p>
      </div>

      <StudentDemographicsFields values={values} onChange={setValues} />

      {error ? (
        <p className="text-sm font-medium text-destructive" role="alert">
          {error}
        </p>
      ) : null}

      <Button
        type="button"
        className="h-11 w-full"
        disabled={pending}
        onClick={onSubmit}
        {...spekit(SPEKIT.profileCompletionSubmit)}
      >
        {pending ? <Loader2 className="size-4 animate-spin" /> : null}
        حفظ ومتابعة
      </Button>

      <div className="flex justify-center gap-4 text-sm">
        <Link href="/dashboard" className="text-muted-foreground underline">
          الرئيسية
        </Link>
        <Link href="/results" className="text-muted-foreground underline">
          نتائجي
        </Link>
      </div>
    </div>
  );
}
