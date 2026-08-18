/** Arabic copy for AUTH-008 public join surfaces. */
export const TRIAL_JOIN_MESSAGES = {
  invalidLink: "الرابط غير صالح. تأكد من الرابط الذي أرسله الأستاذ.",
  inactiveTeacher:
    "عذراً، هذا الحساب غير فعال. يرجى التواصل مع الإدارة",
  teacherWhatsapp:
    "هذا الرقم مسجّل بحساب أستاذ. سجّل الدخول من صفحة الأستاذ.",
  existingNeedsOtp:
    "عندك حساب مسبقاً. أكّد رقم واتساب برمز التحقق للمتابعة.",
  studentsOnly: "هذا الرابط مخصّص للطلاب. سجّل الدخول كطالب أو أنشئ حساباً جديداً.",
  copySuccess: "تم نسخ رابط التجربة",
  inviteSharePrefix: (teacherName: string) =>
    `انضم لصف ${teacherName.trim() || "الأستاذ"} على المؤيد وجرّب الاختبارات المجانية من هالرابط:`,
} as const;
