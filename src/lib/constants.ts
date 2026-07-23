export const APP_NAME = "المؤيد";
export const APP_SLOGAN = "حل بيدك ما حدا بفيدك";
export const APP_TAGLINE = "منصة التقييم والاختبارات الذكية";
export const APP_DESCRIPTION =
  "منصة المؤيد تمنح الطلاب في كافة المراحل والمواد الدراسية تجربة اختبارات تفاعلية، تصحيحاً فورياً، وتحليلات دقيقة للأداء.";
export const APP_PLATFORM_BADGE = "منصة تعليمية متكاملة لجميع المراحل";
export const APP_FOOTER_COPYRIGHT = `© ${new Date().getFullYear()} منصة المؤيد التعليمية — منصة اختبارات وتقييم شاملة لكافة المراحل.`;
export const APP_THEME_COLOR = "#0d9488";

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

/** Common dial codes for teacher student WhatsApp entry (digits only, no +). */
export const WHATSAPP_DIAL_CODES = [
  { code: "963", label: "سوريا" },
  { code: "31", label: "هولندا" },
  { code: "90", label: "تركيا" },
  { code: "966", label: "السعودية" },
  { code: "971", label: "الإمارات" },
  { code: "961", label: "لبنان" },
  { code: "962", label: "الأردن" },
  { code: "20", label: "مصر" },
  { code: "49", label: "ألمانيا" },
  { code: "44", label: "بريطانيا" },
  { code: "1", label: "أمريكا/كندا" },
] as const;

export type WhatsAppDialCode = (typeof WHATSAPP_DIAL_CODES)[number]["code"];

/** E.164 digits only (no +): 8–15 digits, first digit 1–9. */
export const WHATSAPP_E164_DIGITS_RE = /^[1-9]\d{7,14}$/;

/**
 * Strip spaces, dashes, +, and leading 00 → digits for DB / wa.me links.
 */
export function sanitizeWhatsAppForDb(input: string): string {
  let digits = normalizeWhatsAppNumber(input);
  if (digits.startsWith("00")) digits = digits.slice(2);
  return digits;
}

/**
 * Compose dial code + national (or full international) input into DB digits.
 * - If input already starts with the selected dial → keep (no duplicate prefix).
 * - If input is already a full E.164 starting with any known dial → keep as-is
 *   (e.g. dial +963 but paste +31684144342 → 31684144342, not 96331…).
 * - Otherwise prepends `dialCode` after stripping a trunk `0`.
 * - Syrian local `9xxxxxxxx` / `09xxxxxxxx` still resolve when dial is 963.
 */
export function composeWhatsAppNumber(
  dialCode: string,
  nationalOrFull: string
): string {
  let digits = sanitizeWhatsAppForDb(nationalOrFull);
  if (!digits) return "";

  if (digits.startsWith("0")) digits = digits.slice(1);
  if (!digits) return "";

  // Selected dial already present — do not duplicate (963… / 31…)
  if (digits.startsWith(dialCode) && digits.length > dialCode.length) {
    return digits;
  }

  // Full international paste with a different country code than the select
  const sortedDialCodes = [...WHATSAPP_DIAL_CODES].sort(
    (a, b) => b.code.length - a.code.length
  );
  for (const { code } of sortedDialCodes) {
    const national = digits.slice(code.length);
    if (
      digits.startsWith(code) &&
      national.length >= 7 &&
      !national.startsWith("0") &&
      WHATSAPP_E164_DIGITS_RE.test(digits)
    ) {
      return digits;
    }
  }

  // Legacy Syrian helpers: local 9xxxxxxxx with Syria dial selected
  if (
    dialCode === "963" &&
    digits.length === 9 &&
    digits.startsWith("9")
  ) {
    return `963${digits}`;
  }

  return `${dialCode}${digits}`;
}

/** Valid WhatsApp / E.164 digit string for storage and wa.me links. */
export function isValidWhatsAppE164(digits: string): boolean {
  return WHATSAPP_E164_DIGITS_RE.test(digits);
}

/**
 * Split a stored WhatsApp digit string into dial code + national remainder
 * using known dial codes (longest match first). Defaults to Syria.
 */
export function splitWhatsAppDial(fullDigits: string): {
  dialCode: WhatsAppDialCode;
  national: string;
} {
  const digits = sanitizeWhatsAppForDb(fullDigits);
  const sorted = [...WHATSAPP_DIAL_CODES].sort(
    (a, b) => b.code.length - a.code.length
  );
  for (const { code } of sorted) {
    if (digits.startsWith(code) && digits.length > code.length) {
      return { dialCode: code, national: digits.slice(code.length) };
    }
  }
  return { dialCode: "963", national: digits };
}

/**
 * Sanitize teacher-entered WhatsApp into DB form (digits only, Syrian 963…).
 * Accepts local `9xxxxxxxx`, `09xxxxxxxx`, `+963…`, or bare `963…`.
 * Prefer `composeWhatsAppNumber` / `sanitizeWhatsAppForDb` for international.
 */
export function sanitizeSyrianWhatsApp(input: string): string {
  let digits = sanitizeWhatsAppForDb(input);
  if (digits.startsWith("9630") && digits.length >= 13) {
    digits = `963${digits.slice(4)}`;
  } else if (digits.startsWith("0")) {
    digits = `963${digits.slice(1)}`;
  } else if (digits.length === 9 && digits.startsWith("9")) {
    digits = `963${digits}`;
  }
  return digits;
}

/** Syrian mobile: 963 + 9xxxxxxxx (12 digits). */
export function isValidSyrianWhatsApp(digits: string): boolean {
  return /^9639\d{8}$/.test(digits);
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

/** First strong isolate — keeps absolute URLs LTR-friendly inside Arabic WhatsApp text. */
const LTR_ISOLATE_START = "\u2068";
const LTR_ISOLATE_END = "\u2069";

export function buildQuizAbsoluteUrl(quizId: string, origin: string): string {
  const base = origin.replace(/\/+$/, "");
  return `${base}/quiz/${quizId}`;
}

export function buildResultSharePayload(
  score: number,
  quizUrl: string
): { text: string; url: string; whatsappText: string } {
  const text = `لقد حصلت على ${score}% في اختبار عبر تطبيق المؤيد! هل تتحداني؟ جرب الاختبار بنفسك:`;
  const whatsappText = `${text}\n\n${LTR_ISOLATE_START}${quizUrl}${LTR_ISOLATE_END}`;
  return { text, url: quizUrl, whatsappText };
}

export function buildResultShareUrl(score: number, quizUrl: string): string {
  const { whatsappText } = buildResultSharePayload(score, quizUrl);
  return `https://api.whatsapp.com/send?text=${encodeURIComponent(whatsappText)}`;
}
