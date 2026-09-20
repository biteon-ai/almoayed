import { EMAIL_SUPPORT_EMAIL } from "@/lib/email-brand";
import { APP_NAME, APP_URL, TEACHER_WHATSAPP } from "@/lib/constants";

export const APP_SHARE_TEXT =
  "جرّب تطبيق المؤيد للاختبارات والتقييم الدراسي — حلّ بإيدك، ما حدا بيفيدك.";

export const APP_SHARE_PUBLIC_URL = "https://almoayed.app";

export function buildAppSharePayload(origin?: string): {
  title: string;
  text: string;
  url: string;
} {
  const raw = (origin ?? APP_URL).replace(/\/+$/, "");
  const url =
    !raw || raw.includes("localhost") || raw.includes("127.0.0.1")
      ? APP_SHARE_PUBLIC_URL
      : raw.includes("almoayed.app")
        ? raw
        : APP_SHARE_PUBLIC_URL;

  return {
    title: APP_NAME,
    text: APP_SHARE_TEXT,
    url,
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
