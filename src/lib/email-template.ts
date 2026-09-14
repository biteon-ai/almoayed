/**
 * Reusable RTL transactional email HTML for Al-Moayed.
 *
 * Table + inline CSS for Gmail / Outlook / Apple Mail. Swap `heading`,
 * `paragraphs`, `ctaLabel`, and `ctaUrl` per send:
 *
 * - Reset password: heading «تعيين كلمة مرور جديدة», CTA to `/teacher/reset?token=`
 * - Magic link: heading «دخول لمرة واحدة», CTA to `/teacher/magic?token=`
 * - Welcome / alert: same shell; change copy + CTA only. Do not add JS.
 */
import {
  APP_FOOTER_COPYRIGHT,
  APP_NAME,
  APP_PLATFORM_BADGE,
  APP_SLOGAN,
} from "@/lib/constants";
import { getAppUrl } from "@/lib/app-origin";
import {
  EMAIL_BRAND,
  EMAIL_LEGAL_REGION,
  EMAIL_LOGO_PATH,
  EMAIL_OPERATOR,
  EMAIL_SUPPORT_EMAIL,
} from "@/lib/email-brand";

export type TransactionalEmailInput = {
  /** Absolute app origin (no trailing slash). Defaults to `getAppUrl()`. */
  origin?: string;
  /** Hidden inbox preview line (~80 chars). */
  preheader: string;
  heading: string;
  /** Display name interpolated into «مرحباً {name}،» */
  greetingName: string;
  paragraphs: string[];
  ctaLabel: string;
  ctaUrl: string;
  /** Shown above the raw URL fallback. */
  fallbackHint?: string;
  /** Extra footer note (ignore-if-not-you, expiry, etc.). */
  footerNote?: string;
  privacyUrl?: string;
  termsUrl?: string;
  preferencesUrl?: string;
};

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function emailOrigin(origin?: string): string {
  return (origin ?? getAppUrl()).replace(/\/+$/, "");
}

function defaultFooterUrls(origin: string) {
  const mail = `mailto:${EMAIL_SUPPORT_EMAIL}?subject=${encodeURIComponent("المؤيد — تفضيلات البريد")}`;
  return {
    privacyUrl: `${origin}/`,
    termsUrl: `${origin}/`,
    preferencesUrl: mail,
  };
}

export function renderTransactionalEmail(input: TransactionalEmailInput): string {
  const origin = emailOrigin(input.origin);
  const defaults = defaultFooterUrls(origin);
  const footer = {
    privacyUrl: input.privacyUrl ?? defaults.privacyUrl,
    termsUrl: input.termsUrl ?? defaults.termsUrl,
    preferencesUrl: input.preferencesUrl ?? defaults.preferencesUrl,
  };

  const logoUrl = `${origin}${EMAIL_LOGO_PATH}`;
  const name = escapeHtml(input.greetingName.trim() || "أستاذ");
  const heading = escapeHtml(input.heading);
  const preheader = escapeHtml(input.preheader);
  const ctaLabel = escapeHtml(input.ctaLabel);
  const ctaUrl = escapeHtml(input.ctaUrl);
  const fallbackHint = escapeHtml(
    input.fallbackHint ?? "إذا لم يظهر الزر، انسخ الرابط التالي والصقه في المتصفح:"
  );
  const footerNote = input.footerNote ? escapeHtml(input.footerNote) : "";
  const paragraphs = input.paragraphs
    .map((p) => escapeHtml(p))
    .map(
      (p) =>
        `<p style="margin:0 0 14px 0;font-size:15px;line-height:1.8;color:${EMAIL_BRAND.muted};">${p}</p>`
    )
    .join("");

  const year = new Date().getFullYear();

  return `<!DOCTYPE html>
<html lang="ar" dir="rtl" xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta http-equiv="X-UA-Compatible" content="IE=edge" />
  <meta name="color-scheme" content="light" />
  <meta name="supported-color-schemes" content="light" />
  <title>${heading} — ${escapeHtml(APP_NAME)}</title>
  <!--[if mso]>
  <noscript>
    <xml>
      <o:OfficeDocumentSettings>
        <o:PixelsPerInch>96</o:PixelsPerInch>
      </o:OfficeDocumentSettings>
    </xml>
  </noscript>
  <![endif]-->
  <style type="text/css">
    body, table, td, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
    table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
    img { -ms-interpolation-mode: bicubic; border: 0; height: auto; line-height: 100%; outline: none; text-decoration: none; }
    body { margin: 0 !important; padding: 0 !important; width: 100% !important; background: ${EMAIL_BRAND.canvas}; }
    a[x-apple-data-detectors] { color: inherit !important; text-decoration: none !important; }
    @media only screen and (max-width: 620px) {
      .email-shell { width: 100% !important; }
      .email-pad { padding: 16px 12px !important; }
      .email-card-pad { padding: 22px 18px !important; }
      .email-cta { width: 100% !important; }
      .email-cta a { display: block !important; width: 100% !important; box-sizing: border-box !important; }
    }
  </style>
</head>
<body dir="rtl" style="margin:0;padding:0;background-color:${EMAIL_BRAND.canvas};font-family:${EMAIL_BRAND.font};">
  <div style="display:none;font-size:1px;line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden;mso-hide:all;">
    ${preheader}
  </div>
  <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" dir="rtl" style="background-color:${EMAIL_BRAND.canvas};">
    <tr>
      <td class="email-pad" align="center" style="padding:28px 16px;">
        <!--[if mso]>
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="560" align="center"><tr><td>
        <![endif]-->
        <table role="presentation" class="email-shell" cellpadding="0" cellspacing="0" border="0" width="560" dir="rtl" style="width:100%;max-width:560px;margin:0 auto;">
          <tr>
            <td align="center" style="padding:0 0 18px 0;">
              <img src="${escapeHtml(logoUrl)}" width="56" height="56" alt="${escapeHtml(APP_NAME)}" style="display:block;width:56px;height:56px;border-radius:14px;border:1px solid ${EMAIL_BRAND.badgeBorder};background:${EMAIL_BRAND.white};" />
              <p style="margin:12px 0 0 0;font-size:26px;line-height:1.2;font-weight:800;color:${EMAIL_BRAND.ink};">${escapeHtml(APP_NAME)}</p>
              <span style="display:inline-block;margin-top:8px;padding:4px 12px;border-radius:999px;border:1px solid ${EMAIL_BRAND.badgeBorder};background:${EMAIL_BRAND.badgeFill};font-size:11px;font-weight:700;color:${EMAIL_BRAND.tealInk};">${escapeHtml(APP_PLATFORM_BADGE)}</span>
              <p style="margin:10px 0 0 0;font-size:13px;line-height:1.6;font-weight:500;color:${EMAIL_BRAND.muted};">${escapeHtml(APP_SLOGAN)}</p>
            </td>
          </tr>
          <tr>
            <td style="border-radius:${EMAIL_BRAND.cardRadius};border:1px solid ${EMAIL_BRAND.border};background-color:${EMAIL_BRAND.card};box-shadow:0 12px 32px rgba(22,30,43,0.06);overflow:hidden;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td style="height:4px;line-height:4px;font-size:0;background-color:${EMAIL_BRAND.teal};">&nbsp;</td>
                </tr>
                <tr>
                  <td class="email-card-pad" style="padding:28px 28px 12px 28px;background:${EMAIL_BRAND.headerWash};border-bottom:1px solid ${EMAIL_BRAND.border};">
                    <h1 style="margin:0;font-size:20px;line-height:1.4;font-weight:800;color:${EMAIL_BRAND.ink};">${heading}</h1>
                  </td>
                </tr>
                <tr>
                  <td class="email-card-pad" style="padding:24px 28px 28px 28px;">
                    <p style="margin:0 0 16px 0;font-size:16px;line-height:1.7;font-weight:700;color:${EMAIL_BRAND.ink};">مرحباً ${name}،</p>
                    ${paragraphs}
                    <table role="presentation" class="email-cta" cellpadding="0" cellspacing="0" border="0" align="center" style="margin:24px auto 8px auto;">
                      <tr>
                        <td align="center" bgcolor="${EMAIL_BRAND.teal}" style="border-radius:${EMAIL_BRAND.buttonRadius};background-color:${EMAIL_BRAND.teal};box-shadow:0 8px 18px rgba(13,62,62,0.18);">
                          <a href="${ctaUrl}" target="_blank" style="display:inline-block;min-width:220px;padding:16px 28px;font-family:${EMAIL_BRAND.font};font-size:16px;line-height:1.2;font-weight:700;color:${EMAIL_BRAND.white};text-decoration:none;text-align:center;">
                            ${ctaLabel}
                          </a>
                        </td>
                      </tr>
                    </table>
                    <p style="margin:18px 0 8px 0;font-size:12px;line-height:1.7;color:${EMAIL_BRAND.muted};">${fallbackHint}</p>
                    <p dir="ltr" style="margin:0;font-size:12px;line-height:1.6;word-break:break-all;text-align:center;">
                      <a href="${ctaUrl}" target="_blank" style="color:${EMAIL_BRAND.teal};text-decoration:underline;">${ctaUrl}</a>
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td align="center" style="padding:22px 8px 0 8px;">
              ${footerNote ? `<p style="margin:0 0 12px 0;font-size:12px;line-height:1.7;color:${EMAIL_BRAND.muted};">${footerNote}</p>` : ""}
              <p style="margin:0 0 8px 0;font-size:12px;line-height:1.6;color:${EMAIL_BRAND.muted};">${escapeHtml(APP_FOOTER_COPYRIGHT)}</p>
              <p style="margin:0 0 12px 0;font-size:11px;line-height:1.6;color:${EMAIL_BRAND.muted};">${escapeHtml(EMAIL_OPERATOR)} · ${escapeHtml(EMAIL_LEGAL_REGION)} · ${year}</p>
              <p style="margin:0;font-size:11px;line-height:1.8;">
                <a href="${escapeHtml(footer.privacyUrl)}" style="color:${EMAIL_BRAND.teal};text-decoration:none;font-weight:600;">سياسة الخصوصية</a>
                &nbsp;·&nbsp;
                <a href="${escapeHtml(footer.termsUrl)}" style="color:${EMAIL_BRAND.teal};text-decoration:none;font-weight:600;">شروط الاستخدام</a>
                &nbsp;·&nbsp;
                <a href="${escapeHtml(footer.preferencesUrl)}" style="color:${EMAIL_BRAND.teal};text-decoration:none;font-weight:600;">تفضيلات / إلغاء الاشتراك</a>
              </p>
              <p style="margin:10px 0 0 0;font-size:11px;line-height:1.6;color:${EMAIL_BRAND.muted};">
                <a href="mailto:${EMAIL_SUPPORT_EMAIL}" style="color:${EMAIL_BRAND.muted};text-decoration:none;">${EMAIL_SUPPORT_EMAIL}</a>
              </p>
            </td>
          </tr>
        </table>
        <!--[if mso]></td></tr></table><![endif]-->
      </td>
    </tr>
  </table>
</body>
</html>`;
}
