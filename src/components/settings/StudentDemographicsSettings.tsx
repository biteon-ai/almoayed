"use client";

import { useState, useTransition } from "react";
import { updateStudentDemographics } from "@/actions/profile";
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

interface StudentDemographicsSettingsProps {
  fullName: string;
  demographics: StudentDemographics;
}

export function StudentDemographicsSettings({
  fullName,
  demographics,
}: StudentDemographicsSettingsProps) {
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
  const [message, setMessage] = useState<string | null>(null);
  const [isError, setIsError] = useState(false);
  const [pending, startTransition] = useTransition();

  const onSave = () => {
    setMessage(null);
    startTransition(async () => {
      const result = await updateStudentDemographics({
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
        primarySubject: demographics.primarySubject ?? undefined,
        referralSource: demographics.referralSource ?? undefined,
      });
      if (!result.ok) {
        setIsError(true);
        setMessage(result.error);
        return;
      }
      setIsError(false);
      setMessage("تم حفظ بيانات الملف الشخصي.");
    });
  };

  return (
    <div
      className="space-y-4 rounded-2xl border bg-card p-4 shadow-xs"
      {...spekit(SPEKIT.studentDemographicsSettings)}
    >
      <div>
        <h2 className="text-base font-bold">البيانات الشخصية</h2>
        <p className="text-sm text-muted-foreground">
          حدّث مرحلتك وموقعك ليبقى حسابك مكتملاً.
        </p>
      </div>

      <StudentDemographicsFields values={values} onChange={setValues} />

      {message ? (
        <p
          className={
            isError
              ? "text-sm font-medium text-destructive"
              : "text-sm font-medium text-emerald-700"
          }
          role="status"
        >
          {message}
        </p>
      ) : null}

      <Button
        type="button"
        className="h-11 w-full sm:w-auto"
        disabled={pending}
        onClick={onSave}
      >
        {pending ? <Loader2 className="size-4 animate-spin" /> : null}
        حفظ البيانات
      </Button>
    </div>
  );
}
