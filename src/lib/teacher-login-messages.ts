/** [AUTH-009] Arabic copy for teacher password reset and magic-link flows. */

export const TEACHER_LOGIN_MESSAGES = {
  backToMainLogin: "العودة لتسجيل الدخول الرئيسي",
  forgotPassword: "نسيت كلمة المرور؟",
  magicLinkCta: "أرسل لي رابط دخول لمرة واحدة",
  sendReset: "إرسال رابط إعادة التعيين",
  sendMagic: "إرسال رابط الدخول",
  backToTeacherLogin: "العودة لتسجيل الدخول",
  resetTitle: "تعيين كلمة مرور جديدة",
  newPassword: "كلمة المرور الجديدة",
  confirmPassword: "تأكيد كلمة المرور",
  savePassword: "حفظ كلمة المرور",
  resetSuccess: "تم تحديث كلمة المرور. سجّل الدخول من صفحة دخول المدرس.",
  goTeacherLogin: "دخول المدرس",
  magicPending: "جاري تسجيل الدخول…",
  successResetMail: "تم إرسال رسالة إعادة تعيين كلمة المرور إلى بريدك.",
  successMagicMail: "تم إرسال رابط الدخول لمرة واحدة إلى بريدك.",
  resetSubject: "إعادة تعيين كلمة المرور — المؤيد",
  magicSubject: "رابط دخول لمرة واحدة — المؤيد",
  resetEmailPreheader: "عيّن كلمة مرور جديدة خلال 60 دقيقة — لمرة واحدة فقط.",
  resetEmailCta: "تعيين كلمة المرور",
  resetEmailP1:
    "طلبت إعادة تعيين كلمة المرور لحساب المدرس على منصة المؤيد.",
  resetEmailP2:
    "اضغط الزر أدناه لتعيين كلمة مرور جديدة. الرابط صالح لمدة 60 دقيقة ولمرة واحدة فقط.",
  resetEmailFooter:
    "إذا لم تطلب إعادة التعيين، تجاهل هذه الرسالة. لن يتغيّر شيء في حسابك.",
  magicEmailPreheader: "ادخل إلى لوحة الأستاذ خلال 15 دقيقة — لمرة واحدة فقط.",
  magicEmailHeading: "دخول لمرة واحدة",
  magicEmailCta: "دخول لوحة الأستاذ",
  magicEmailP1:
    "طلبت رابط دخول لمرة واحدة لحساب المدرس على منصة المؤيد.",
  magicEmailP2:
    "اضغط الزر أدناه للدخول دون كتابة كلمة المرور. الرابط صالح لمدة 15 دقيقة ولمرة واحدة فقط.",
  magicEmailFooter:
    "إذا لم تطلب هذا الرابط، تجاهل الرسالة. لن يتم فتح جلسة لحسابك.",
  emailFallbackHint:
    "إذا لم يظهر الزر، انسخ الرابط التالي والصقه في المتصفح:",
} as const;
