"use client";

import {
  EDUCATION_STAGE_LABELS,
  EDUCATION_STAGES,
} from "@/lib/student-profile";
import { SYRIA_PROVINCES } from "@/lib/syria-provinces";
import type { EducationStage } from "@/types/database";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { choiceChipClass } from "@/lib/ui-chrome";
import { cn } from "@/lib/utils";

export type DemographicsFormValues = {
  fullName: string;
  birthYear: string;
  birthMonth: string;
  birthDay: string;
  province: string;
  city: string;
  educationStage: string;
  email: string;
  address: string;
};

export function birthPartsToIso(
  year: string,
  month: string,
  day: string
): string {
  if (!year || !month || !day) return "";
  return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
}

export function isoToBirthParts(iso: string | null | undefined): {
  year: string;
  month: string;
  day: string;
} {
  if (!iso || !/^\d{4}-\d{2}-\d{2}/.test(iso)) {
    return { year: "", month: "", day: "" };
  }
  const [year, month, day] = iso.slice(0, 10).split("-");
  return { year, month: String(Number(month)), day: String(Number(day)) };
}

const YEARS = Array.from({ length: 80 }, (_, i) =>
  String(new Date().getFullYear() - 6 - i)
);
const MONTHS = Array.from({ length: 12 }, (_, i) => String(i + 1));
const DAYS = Array.from({ length: 31 }, (_, i) => String(i + 1));

interface StudentDemographicsFieldsProps {
  values: DemographicsFormValues;
  onChange: (next: DemographicsFormValues) => void;
  showName?: boolean;
  className?: string;
}

export function StudentDemographicsFields({
  values,
  onChange,
  showName = true,
  className,
}: StudentDemographicsFieldsProps) {
  const set = <K extends keyof DemographicsFormValues>(
    key: K,
    value: DemographicsFormValues[K]
  ) => onChange({ ...values, [key]: value });

  return (
    <div className={cn("space-y-4", className)}>
      {showName ? (
        <div className="space-y-1.5">
          <Label htmlFor="fullName">الاسم الكامل</Label>
          <Input
            id="fullName"
            className="h-11"
            value={values.fullName}
            onChange={(e) => set("fullName", e.target.value)}
            autoComplete="name"
          />
        </div>
      ) : null}

      <div className="space-y-1.5">
        <Label>تاريخ الميلاد</Label>
        <div className="grid grid-cols-3 gap-2" dir="ltr">
          <Select
            value={values.birthDay || null}
            onValueChange={(v) => set("birthDay", v ?? "")}
          >
            <SelectTrigger className="h-11 w-full">
              <SelectValue placeholder="يوم" />
            </SelectTrigger>
            <SelectContent>
              {DAYS.map((d) => (
                <SelectItem key={d} value={d}>
                  {d}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={values.birthMonth || null}
            onValueChange={(v) => set("birthMonth", v ?? "")}
          >
            <SelectTrigger className="h-11 w-full">
              <SelectValue placeholder="شهر" />
            </SelectTrigger>
            <SelectContent>
              {MONTHS.map((m) => (
                <SelectItem key={m} value={m}>
                  {m}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={values.birthYear || null}
            onValueChange={(v) => set("birthYear", v ?? "")}
          >
            <SelectTrigger className="h-11 w-full">
              <SelectValue placeholder="سنة" />
            </SelectTrigger>
            <SelectContent>
              {YEARS.map((y) => (
                <SelectItem key={y} value={y}>
                  {y}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-1.5">
        <Label>المحافظة</Label>
        <Select
          value={values.province || null}
          onValueChange={(v) => set("province", v ?? "")}
        >
          <SelectTrigger className="h-11 w-full">
            <SelectValue placeholder="اختر المحافظة" />
          </SelectTrigger>
          <SelectContent>
            {SYRIA_PROVINCES.map((p) => (
              <SelectItem key={p} value={p}>
                {p}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="city">المدينة</Label>
        <Input
          id="city"
          className="h-11"
          value={values.city}
          onChange={(e) => set("city", e.target.value)}
        />
      </div>

      <div className="space-y-1.5">
        <Label>المرحلة التعليمية</Label>
        <div className="flex flex-wrap gap-2.5">
          {EDUCATION_STAGES.map((stage) => (
            <button
              key={stage}
              type="button"
              onClick={() => set("educationStage", stage)}
              className={choiceChipClass(values.educationStage === stage)}
            >
              {EDUCATION_STAGE_LABELS[stage as EducationStage]}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="email">البريد الإلكتروني (اختياري)</Label>
        <Input
          id="email"
          type="email"
          className="h-11"
          dir="ltr"
          value={values.email}
          onChange={(e) => set("email", e.target.value)}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="address">العنوان التفصيلي (اختياري)</Label>
        <Input
          id="address"
          className="h-11"
          value={values.address}
          onChange={(e) => set("address", e.target.value)}
        />
      </div>
    </div>
  );
}
