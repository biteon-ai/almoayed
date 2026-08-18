import { APP_URL, normalizeWhatsAppNumber } from "@/lib/constants";
import { validateDisplayName } from "@/lib/profile-name";
import type { EducationStage } from "@/types/database";
import {
  isEducationStage,
  parseBirthDate,
} from "@/lib/student-profile";
import type { TeacherAccountStatus } from "@/types/database";
import { isTeacherAccountActive } from "@/lib/account-access";

const LTR_ISOLATE_START = "\u2068";
const LTR_ISOLATE_END = "\u2069";

export type JoinFormFields = {
  firstName: string;
  lastName: string;
  educationStage: string;
  birthDate: string;
  whatsappNumber: string;
};

export type ResolvedJoinTeacher = {
  id: string;
  teacher_code: string;
  full_name: string;
  teacher_account_status: TeacherAccountStatus | null;
};

export function normalizeTeacherJoinCode(raw: string): string {
  return raw.trim();
}

export function buildTrialJoinPath(teacherCode: string): string {
  return `/join/${encodeURIComponent(normalizeTeacherJoinCode(teacherCode))}`;
}

export function buildTrialJoinAbsoluteUrl(
  teacherCode: string,
  origin: string = APP_URL
): string {
  const base = origin.replace(/\/+$/, "");
  return `${base}${buildTrialJoinPath(teacherCode)}`;
}

export function buildTrialInviteShareUrl(input: {
  teacherName: string;
  joinUrl: string;
  textPrefix?: string;
}): { text: string; whatsappHref: string } {
  const prefix =
    input.textPrefix ??
    `انضم لصف ${input.teacherName.trim() || "الأستاذ"} على المؤيد وجرّب الاختبارات المجانية من هالرابط:`;
  const text = `${prefix}\n\n${LTR_ISOLATE_START}${input.joinUrl}${LTR_ISOLATE_END}`;
  return {
    text,
    whatsappHref: `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`,
  };
}

/** OTP skip only when no profile exists for this WhatsApp. */
export function canSkipOtp(profileExists: boolean): boolean {
  return !profileExists;
}

export function validateTrialJoinForm(fields: JoinFormFields):
  | {
      ok: true;
      fullName: string;
      whatsapp: string;
      educationStage: EducationStage;
      birthDate: string;
    }
  | { ok: false; message: string; field?: string } {
  const first = fields.firstName.trim();
  const last = fields.lastName.trim();
  if (!first) {
    return { ok: false, message: "الاسم الأول مطلوب", field: "first_name" };
  }
  if (!last) {
    return { ok: false, message: "الكنية مطلوبة", field: "last_name" };
  }

  const combined = validateDisplayName(`${first} ${last}`);
  if (!combined.ok) {
    return { ok: false, message: combined.message, field: "first_name" };
  }

  if (!fields.educationStage || !isEducationStage(fields.educationStage)) {
    return {
      ok: false,
      message: "اختر المرحلة الدراسية",
      field: "education_stage",
    };
  }

  const birth = parseBirthDate(fields.birthDate);
  if (!birth.ok) {
    return { ok: false, message: birth.message, field: "birth_date" };
  }

  const whatsapp = normalizeWhatsAppNumber(fields.whatsappNumber);
  if (whatsapp.length < 10 || whatsapp.length > 15) {
    return {
      ok: false,
      message: "رقم واتساب غير صالح",
      field: "whatsapp_number",
    };
  }

  return {
    ok: true,
    fullName: combined.value,
    whatsapp,
    educationStage: fields.educationStage,
    birthDate: birth.value,
  };
}

export function isJoinTeacherActive(
  teacher: Pick<ResolvedJoinTeacher, "teacher_account_status">
): boolean {
  return isTeacherAccountActive(teacher.teacher_account_status);
}

/** Case-insensitive match helper for client-side tests. */
export function teacherCodesMatch(a: string, b: string): boolean {
  return normalizeTeacherJoinCode(a).toLowerCase() === normalizeTeacherJoinCode(b).toLowerCase();
}
