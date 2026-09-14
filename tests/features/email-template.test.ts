import { describe, expect, it } from "vitest";
import { EMAIL_BRAND } from "@/lib/email-brand";
import { renderTransactionalEmail } from "@/lib/email-template";
import {
  magicEmailHtml,
  resetEmailHtml,
} from "@/lib/teacher-login-recovery";
import { TEACHER_LOGIN_MESSAGES } from "@/lib/teacher-login-messages";

const FEATURE = "[AUTH-009]";

describe(`${FEATURE} branded transactional email`, () => {
  it("renders RTL shell with Al-Moayed brand tokens", () => {
    const html = renderTransactionalEmail({
      origin: "https://almoayed.app",
      preheader: "معاينة",
      heading: "عنوان تجريبي",
      greetingName: "سارة",
      paragraphs: ["فقرة أولى."],
      ctaLabel: "متابعة",
      ctaUrl: "https://almoayed.app/teacher/login",
    });

    expect(html).toContain('lang="ar"');
    expect(html).toContain('dir="rtl"');
    expect(html).toContain(EMAIL_BRAND.teal);
    expect(html).toContain(EMAIL_BRAND.canvas);
    expect(html).toContain("https://almoayed.app/icon-192.png");
    expect(html).toContain("المؤيد");
    expect(html).toContain("حلّ بإيدك، ما حدا بيفيدك.");
    expect(html).toContain("سياسة الخصوصية");
    expect(html).toContain("شروط الاستخدام");
    expect(html).toContain("تفضيلات / إلغاء الاشتراك");
    expect(html).toContain("مرحباً سارة،");
    expect(html).not.toContain("<script");
  });

  it("escapes untrusted names so copy cannot inject HTML", () => {
    const html = renderTransactionalEmail({
      origin: "https://almoayed.app",
      preheader: "x",
      heading: "<script>alert(1)</script>",
      greetingName: `أيمن</p><img src=x onerror=alert(1)>`,
      paragraphs: [`<b>hi</b>`],
      ctaLabel: "Go",
      ctaUrl: `https://almoayed.app/x?q="><script>`,
    });

    expect(html).not.toContain("<script>alert(1)</script>");
    expect(html).toContain("&lt;script&gt;alert(1)&lt;/script&gt;");
    expect(html).toContain("&lt;b&gt;hi&lt;/b&gt;");
    expect(html).toContain("&lt;img src=x onerror=alert(1)&gt;");
    expect(html).not.toContain("<img src=x");
  });

  it("reset vs magic only swap heading, CTA, and destination", () => {
    const reset = resetEmailHtml(
      "أستاذ المؤيد",
      "https://almoayed.app/teacher/reset?token=abc",
      "https://almoayed.app"
    );
    const magic = magicEmailHtml(
      "أستاذ المؤيد",
      "https://almoayed.app/teacher/magic?token=xyz",
      "https://almoayed.app"
    );

    expect(reset).toContain(TEACHER_LOGIN_MESSAGES.resetTitle);
    expect(reset).toContain(TEACHER_LOGIN_MESSAGES.resetEmailCta);
    expect(reset).toContain("/teacher/reset?token=abc");
    expect(reset).toContain("60 دقيقة");

    expect(magic).toContain(TEACHER_LOGIN_MESSAGES.magicEmailHeading);
    expect(magic).toContain(TEACHER_LOGIN_MESSAGES.magicEmailCta);
    expect(magic).toContain("/teacher/magic?token=xyz");
    expect(magic).toContain("15 دقيقة");

    expect(reset).toContain('bgcolor="#0d6e6e"');
    expect(magic).toContain('bgcolor="#0d6e6e"');
  });
});
