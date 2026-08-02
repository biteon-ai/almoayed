import { AuthErrorCode } from "@/lib/auth-error-codes";

/** Client-side Arabic copy — never sent over the Server Action wire. */
const LOGIN_UI_AR: Record<AuthErrorCode, string> = {
  [AuthErrorCode.MISSING_WHATSAPP]: "رجاءً أدخل رقم واتسابك.",
  [AuthErrorCode.INVALID_WHATSAPP]:
    "رقم واتساب غير صالح. تأكد من إدخال الرقم مع رمز البلد (مثال: 9639xxxxxxxx).",
  [AuthErrorCode.SUPABASE_ENV_MISSING]:
    "ما قدرنا نتصل بالخادم. جرّب مرة تانية بعد شوي.",
  [AuthErrorCode.SUPABASE_CONNECTION_ERROR]:
    "صار في مشكلة بالاتصال. جرّب مرة تانية.",
  [AuthErrorCode.SUPABASE_PROFILE_FETCH_FAILED]:
    "ما قدرنا نتحقق من حسابك. تأكد من رقم واتسابك وجرب مرة تانية.",
  [AuthErrorCode.TEACHER_CODE_REQUIRED]:
    "رجاءً أدخل رمز الأستاذ للتسجيل كطالب جديد.",
  [AuthErrorCode.INVALID_TEACHER_CODE]:
    "رمز الأستاذ غير صحيح. تأكد من الكود اللي أعطاك ياه الأستاذ.",
  [AuthErrorCode.SUPABASE_PROFILE_CREATE_FAILED]:
    "ما قدرنا نسجّل حسابك. حاول مرة تانية.",
  [AuthErrorCode.SUPABASE_STUDENT_LINK_FAILED]:
    "ما قدرنا نربط حسابك بالأستاذ. حاول مرة تانية.",
  [AuthErrorCode.SUPABASE_SESSION_UPDATE_FAILED]:
    "صار في مشكلة بالاتصال. جرّب مرة تانية.",
  [AuthErrorCode.SESSION_SAVE_FAILED]:
    "ما قدرنا نفتح الجلسة. جرّب تسجيل الدخول مرة تانية.",
  [AuthErrorCode.LOGIN_UNEXPECTED]:
    "صار في مشكلة بالاتصال. جرّب مرة تانية.",
  [AuthErrorCode.ACCOUNT_PENDING_VERIFICATION]:
    "حسابك لسه ما تفعّل. أرسل رسالة واتساب للأستاذ حتى يفعّل اشتراكك وتقدر تدخل على الاختبارات.",
  [AuthErrorCode.MISSING_FULL_NAME]: "رجاءً أدخل اسمك الكامل.",
  [AuthErrorCode.ALREADY_REGISTERED]:
    "عندك حساب مسبقاً. سجّل الدخول عبر واتساب OTP من الزر تحت.",
  [AuthErrorCode.OTP_UNAVAILABLE]:
    "خدمة التحقق عبر واتساب غير متاحة حالياً. جرّب بعد شوي.",
  [AuthErrorCode.OTP_INVALID]:
    "رمز التحقق غير صالح أو منتهي. ابدأ تسجيل الدخول من جديد.",
  [AuthErrorCode.OTP_REPLAY]:
    "تم استخدام رابط التحقق مسبقاً. ابدأ تسجيل الدخول من جديد.",
  [AuthErrorCode.REGISTER_REQUIRED]:
    "ما لقينا حساب مرتبط بهالرقم. سجّل أولاً برمز الأستاذ.",
  [AuthErrorCode.ADMIN_FALLBACK_DENIED]: "تعذر تسجيل الدخول. تأكد من البيانات.",
  [AuthErrorCode.DEMO_BYPASS_DISABLED]:
    "الحسابات التجريبية غير مفعّلة في هالبيئة.",
  [AuthErrorCode.ACCOUNT_INACTIVE]:
    "عذراً، هذا الحساب غير فعال. يرجى التواصل مع الإدارة",
};

/** Map callback/query `error` param → AuthErrorCode */
const QUERY_ERROR_MAP: Record<string, AuthErrorCode> = {
  otp_invalid: AuthErrorCode.OTP_INVALID,
  otp_replay: AuthErrorCode.OTP_REPLAY,
  otp_unavailable: AuthErrorCode.OTP_UNAVAILABLE,
  register_required: AuthErrorCode.REGISTER_REQUIRED,
  otp_config: AuthErrorCode.OTP_UNAVAILABLE,
  account_inactive: AuthErrorCode.ACCOUNT_INACTIVE,
};

export function loginMessageForCode(code: string): string {
  return (
    LOGIN_UI_AR[code as AuthErrorCode] ??
    LOGIN_UI_AR[AuthErrorCode.LOGIN_UNEXPECTED]
  );
}

export function loginMessageForQueryError(errorParam: string | null): string | null {
  if (!errorParam) return null;
  const code = QUERY_ERROR_MAP[errorParam];
  return code ? loginMessageForCode(code) : null;
}
