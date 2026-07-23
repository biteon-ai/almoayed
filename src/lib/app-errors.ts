/**
 * Request/network errors use English `code` (Error.message) for logs and debugging.
 * User-facing copy is always Arabic via `userMessage` / `toUserMessage()`.
 */

export const ErrorCode = {
  NETWORK_ERROR: "NETWORK_ERROR",
  SUBSCRIPTION_REQUIRED: "SUBSCRIPTION_REQUIRED",
  PRO_REQUIRED: "PRO_REQUIRED",
  GROUP_REQUIRED: "GROUP_REQUIRED",
  QUIZ_EMPTY: "QUIZ_EMPTY",
  QUIZ_INACTIVE: "QUIZ_INACTIVE",
  QUIZ_CHANGED: "QUIZ_CHANGED",
  QUIZ_QUESTIONS_FETCH_FAILED: "QUIZ_QUESTIONS_FETCH_FAILED",
  QUIZ_SUBMIT_SAVE_FAILED: "QUIZ_SUBMIT_SAVE_FAILED",
  QUIZ_ANSWERS_SAVE_FAILED: "QUIZ_ANSWERS_SAVE_FAILED",
  AUTH_PROFILE_FETCH_FAILED: "AUTH_PROFILE_FETCH_FAILED",
  AUTH_PROFILE_CREATE_FAILED: "AUTH_PROFILE_CREATE_FAILED",
  PRO_UPGRADE_REQUEST_FAILED: "PRO_UPGRADE_REQUEST_FAILED",
  TEACHER_SWITCH_DENIED: "TEACHER_SWITCH_DENIED",
} as const;

export type ErrorCode = (typeof ErrorCode)[keyof typeof ErrorCode];

const UI_AR: Record<string, string> = {
  [ErrorCode.NETWORK_ERROR]: "صار في مشكلة بالاتصال. جرّب مرة تانية.",
  [ErrorCode.SUBSCRIPTION_REQUIRED]:
    "حسابك لسه ما تفعّل. تواصل مع الأستاذ لتفعيل اشتراكك.",
  [ErrorCode.PRO_REQUIRED]:
    "هذا الاختبار متاح لمشتركي Pro فقط. اطلب ترقية من الأستاذ.",
  [ErrorCode.GROUP_REQUIRED]:
    "هذا الاختبار مخصص لمجموعة معينة وأنت مو ضمنها.",
  [ErrorCode.QUIZ_EMPTY]: "هذا الاختبار ما فيه أسئلة بعد. راجع الأستاذ.",
  [ErrorCode.QUIZ_INACTIVE]: "هذا الاختبار لم يعد متاحاً. تواصل مع الأستاذ.",
  [ErrorCode.QUIZ_CHANGED]:
    "تعذرت مزامنة محاولتك لأن الاختبار تغيّر. افتح الاختبار من جديد وأعد المحاولة.",
  [ErrorCode.QUIZ_QUESTIONS_FETCH_FAILED]:
    "صار خطأ بجلب أسئلة الاختبار. جرّب مرة تانية.",
  [ErrorCode.QUIZ_SUBMIT_SAVE_FAILED]:
    "ما قدرنا نحفظ إجاباتك. جرّب مرة تانية.",
  [ErrorCode.QUIZ_ANSWERS_SAVE_FAILED]: "صار خطأ بحفظ الإجابات.",
  [ErrorCode.AUTH_PROFILE_FETCH_FAILED]:
    "صار في مشكلة بالاتصال. جرّب مرة تانية.",
  [ErrorCode.AUTH_PROFILE_CREATE_FAILED]:
    "ما قدرنا نسجّل حسابك. حاول مرة تانية.",
  [ErrorCode.PRO_UPGRADE_REQUEST_FAILED]:
    "ما قدرنا نرسل طلب الترقية. جرّب مرة تانية.",
  [ErrorCode.TEACHER_SWITCH_DENIED]: "ما عندك صلاحية للتبديل لهاد الأستاذ.",
};

export class AppError extends Error {
  readonly code: string;
  readonly userMessage: string;

  constructor(code: string, userMessage: string) {
    super(code);
    this.name = "AppError";
    this.code = code;
    this.userMessage = userMessage;
  }
}

export function uiMessage(code: keyof typeof UI_AR | string): string {
  return UI_AR[code] ?? UI_AR[ErrorCode.NETWORK_ERROR];
}

export function logRequestError(context: string, cause: unknown): void {
  console.error(`[${ErrorCode.NETWORK_ERROR}] ${context}:`, cause);
}

export function appError(
  code: string,
  userMessage?: string
): AppError {
  return new AppError(code, userMessage ?? uiMessage(code));
}

export function networkError(context: string, cause: unknown): AppError {
  logRequestError(context, cause);
  return appError(ErrorCode.NETWORK_ERROR);
}

/** Map thrown errors to Arabic UI copy; never expose raw English network text. */
export function toUserMessage(
  error: unknown,
  fallback = UI_AR[ErrorCode.NETWORK_ERROR]
): string {
  if (error instanceof AppError) {
    return error.userMessage;
  }

  if (error instanceof Error) {
    const mapped = UI_AR[error.message];
    if (mapped) return mapped;

    // Validation / business messages already in Arabic
    if (/[\u0600-\u06FF]/.test(error.message)) {
      return error.message;
    }
  }

  return fallback;
}
