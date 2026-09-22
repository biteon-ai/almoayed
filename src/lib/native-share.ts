import { EMAIL_SUPPORT_EMAIL } from "@/lib/email-brand";
import { APP_NAME, TEACHER_WHATSAPP } from "@/lib/constants";
import {
  PRODUCTION_CANONICAL_ORIGIN,
  resolveShareOrigin,
} from "@/lib/app-origin";

export const APP_SHARE_TEXT =
  "جرّب تطبيق المؤيد للاختبارات والتقييم الدراسي — حلّ بإيدك، ما حدا بيفيدك.";

export const APP_SHARE_PUBLIC_URL = PRODUCTION_CANONICAL_ORIGIN;

export function buildAppSharePayload(origin?: string): {
  title: string;
  text: string;
  url: string;
} {
  return {
    title: APP_NAME,
    text: APP_SHARE_TEXT,
    url: resolveShareOrigin(origin),
  };
}

export function buildSupportWhatsAppUrl(): string {
  const text = encodeURIComponent("مرحباً، أحتاج مساعدة في تطبيق المؤيد");
  return `https://api.whatsapp.com/send?phone=${TEACHER_WHATSAPP}&text=${text}`;
}

export function supportMailtoHref(): string {
  const subject = encodeURIComponent("المؤيد — مساعدة");
  return `mailto:${EMAIL_SUPPORT_EMAIL}?subject=${subject}`;
}

export { EMAIL_SUPPORT_EMAIL };
