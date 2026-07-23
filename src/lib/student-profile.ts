import { isSyriaProvince } from "@/lib/syria-provinces";
import { validateDisplayName } from "@/lib/profile-name";
import type {
  EducationStage,
  ReferralSource,
  StudentDemographics,
} from "@/types/database";

export const EDUCATION_STAGES: EducationStage[] = [
  "primary",
  "preparatory",
  "secondary",
  "baccalaureate",
  "university",
  "other",
];

export const REFERRAL_SOURCES: ReferralSource[] = [
  "class",
  "whatsapp",
  "friend",
  "social",
  "other",
];

export const EDUCATION_STAGE_LABELS: Record<EducationStage, string> = {
  primary: "ابتدائي",
  preparatory: "تاسع (تعليم أساسي)",
  secondary: "ثانوي",
  baccalaureate: "بكالوريا (ثانوي)",
  university: "جامعة",
  other: "غير ذلك",
};

/** Onboarding step-1 options (subset mapped to stages) */
export const ONBOARDING_STAGE_OPTIONS: {
  value: EducationStage;
  label: string;
}[] = [
  { value: "preparatory", label: "تاسع (تعليم أساسي)" },
  { value: "baccalaureate", label: "بكالوريا (ثانوي)" },
  { value: "university", label: "جامعة" },
  { value: "other", label: "غير ذلك" },
];

export const REFERRAL_SOURCE_LABELS: Record<ReferralSource, string> = {
  class: "المعهد / المدرسة",
  whatsapp: "مجموعة واتساب",
  friend: "عن طريق صديق",
  social: "وسائل التواصل",
  other: "غير ذلك",
};

export const PRIMARY_SUBJECT_PRESETS = [
  "رياضيات",
  "فيزياء",
  "كيمياء",
  "لغة إنكليزية",
  "لغة عربية",
] as const;

const MIN_AGE_YEARS = 6;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function isEducationStage(value: string): value is EducationStage {
  return (EDUCATION_STAGES as string[]).includes(value);
}

export function isReferralSource(value: string): value is ReferralSource {
  return (REFERRAL_SOURCES as string[]).includes(value);
}

export function sanitizeReturnPath(from: string | null | undefined): string {
  if (!from) return "/dashboard";
  const trimmed = from.trim();
  if (!trimmed.startsWith("/") || trimmed.startsWith("//")) {
    return "/dashboard";
  }
  if (trimmed.includes("://") || trimmed.includes("\\")) {
    return "/dashboard";
  }
  return trimmed;
}

export function parseBirthDate(
  iso: string
): { ok: true; value: string } | { ok: false; message: string } {
  const value = iso.trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return { ok: false, message: "تاريخ الميلاد غير صالح" };
  }
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) {
    return { ok: false, message: "تاريخ الميلاد غير صالح" };
  }
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  if (date > today) {
    return { ok: false, message: "تاريخ الميلاد لا يمكن أن يكون في المستقبل" };
  }
  const min = new Date(today);
  min.setFullYear(min.getFullYear() - MIN_AGE_YEARS);
  if (date > min) {
    return {
      ok: false,
      message: `العمر يجب أن يكون ${MIN_AGE_YEARS} سنوات على الأقل`,
    };
  }
  return { ok: true, value };
}

export function isRequiredProfileComplete(
  fields: Partial<StudentDemographics> & { fullName?: string }
): boolean {
  const name = fields.fullName?.trim() ?? "";
  if (!name) return false;
  if (!fields.birthDate || !parseBirthDate(fields.birthDate).ok) return false;
  if (!fields.province || !isSyriaProvince(fields.province)) return false;
  if (!fields.city?.trim()) return false;
  if (!fields.educationStage || !isEducationStage(fields.educationStage)) {
    return false;
  }
  if (fields.email?.trim() && !EMAIL_RE.test(fields.email.trim())) {
    return false;
  }
  return true;
}

export function shouldBlockNewQuiz(input: {
  profileCompleted: boolean;
  uniqueCompletedQuizzes: number;
  hasSubmissionForQuiz: boolean;
}): boolean {
  if (input.profileCompleted) return false;
  if (input.hasSubmissionForQuiz) return false;
  return input.uniqueCompletedQuizzes >= 2;
}

export function validateOnboardingInput(input: {
  educationStage: string;
  referralSource: string;
  primarySubject: string;
}):
  | {
      ok: true;
      value: {
        educationStage: EducationStage;
        referralSource: ReferralSource;
        primarySubject: string;
      };
    }
  | { ok: false; message: string } {
  if (!isEducationStage(input.educationStage)) {
    return { ok: false, message: "اختر المرحلة الدراسية" };
  }
  if (!isReferralSource(input.referralSource)) {
    return { ok: false, message: "اختر كيف حصلت على كود الأستاذ" };
  }
  const subject = input.primarySubject.trim();
  if (!subject) {
    return { ok: false, message: "المادة الرئيسية مطلوبة" };
  }
  if (subject.length > 80) {
    return { ok: false, message: "اسم المادة طويل جداً" };
  }
  return {
    ok: true,
    value: {
      educationStage: input.educationStage,
      referralSource: input.referralSource,
      primarySubject: subject,
    },
  };
}

export function validateRequiredProfileInput(input: {
  fullName: string;
  birthDate: string;
  province: string;
  city: string;
  educationStage: string;
  email?: string;
  address?: string;
}):
  | {
      ok: true;
      value: {
        fullName: string;
        birthDate: string;
        province: string;
        city: string;
        educationStage: EducationStage;
        email: string | null;
        address: string;
      };
    }
  | { ok: false; message: string } {
  const name = validateDisplayName(input.fullName);
  if (!name.ok) return name;

  const birth = parseBirthDate(input.birthDate);
  if (!birth.ok) return birth;

  if (!isSyriaProvince(input.province)) {
    return { ok: false, message: "اختر المحافظة" };
  }
  const city = input.city.trim();
  if (!city) {
    return { ok: false, message: "المدينة مطلوبة" };
  }
  if (!isEducationStage(input.educationStage)) {
    return { ok: false, message: "اختر المرحلة التعليمية" };
  }

  const emailRaw = input.email?.trim() ?? "";
  if (emailRaw && !EMAIL_RE.test(emailRaw)) {
    return { ok: false, message: "البريد الإلكتروني غير صالح" };
  }

  return {
    ok: true,
    value: {
      fullName: name.value,
      birthDate: birth.value,
      province: input.province,
      city,
      educationStage: input.educationStage,
      email: emailRaw || null,
      address: input.address?.trim() ?? "",
    },
  };
}
