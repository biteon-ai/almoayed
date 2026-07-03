export const APP_NAME = "المؤيد";
export const APP_SLOGAN = "حل بيدك ما حدا بفيدك";

export const TEACHER_WHATSAPP =
  process.env.NEXT_PUBLIC_TEACHER_WHATSAPP ?? "963999999999";

export const APP_URL =
  process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

/** Demo student — matches supabase seed */
export const DEMO_STUDENT = {
  whatsapp_number: "963987654321",
  full_name: "أحمد الطالب",
} as const;

export const DEMO_TEACHER = {
  whatsapp_number: "963912345678",
  full_name: "أستاذ المؤيد",
  teacher_code: "AlMoayed-DEMO",
} as const;

export function normalizeWhatsAppNumber(input: string): string {
  return input.replace(/\D/g, "");
}

export function formatWhatsAppDisplay(number: string): string {
  const digits = normalizeWhatsAppNumber(number);
  if (digits.startsWith("963") && digits.length >= 12) {
    return `+${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6)}`;
  }
  return `+${digits}`;
}

export function buildTeacherVerificationUrl(
  studentNumber: string,
  token: string,
  fullName?: string
): string {
  const name = fullName?.trim() || "طالب جديد";
  const text = encodeURIComponent(
    `مرحباً أستاذ، أنا ${name} وأريد تفعيل حسابي على تطبيق المؤيد.\n` +
      `رقم واتسابي: ${formatWhatsAppDisplay(studentNumber)}\n` +
      `رمز التفعيل: ${token}`
  );
  return `https://api.whatsapp.com/send?phone=${TEACHER_WHATSAPP}&text=${text}`;
}

export function buildResultShareUrl(score: number, quizUrl: string): string {
  const text = encodeURIComponent(
    `لقد حصلت على ${score}% في اختبار الرياضيات للبكالوريا عبر تطبيق المؤيد! هل تتحداني؟ جرب الاختبار بنفسك: ${quizUrl}`
  );
  return `https://api.whatsapp.com/send?text=${text}`;
}
