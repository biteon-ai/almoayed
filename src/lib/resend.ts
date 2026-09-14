import { Resend } from "resend";

/** Resend dashboard placeholder — replace with a real `re_…` key. */
export const RESEND_PLACEHOLDER_API_KEY = "re_xxxxxxxxx";

export const FIRST_EMAIL_SUBJECT = "Hello World";
export const FIRST_EMAIL_HTML =
  "<p>Congrats on sending your <strong>first email</strong>!</p>";
export const DEFAULT_RESEND_FROM = "onboarding@resend.dev";
export const DEFAULT_RESEND_TO = "almoayed@biteon.nl";

export type SendEmailInput = {
  from?: string;
  to?: string | string[];
  subject?: string;
  html?: string;
};

export type SendEmailResult =
  | { ok: true; id: string }
  | { ok: false; message: string };

export type ResendEmailClient = {
  emails: {
    send: Resend["emails"]["send"];
  };
};

export function getResendApiKey(): string {
  return process.env.RESEND_API_KEY?.trim() ?? "";
}

export function isResendPlaceholderApiKey(key: string): boolean {
  return key.trim() === RESEND_PLACEHOLDER_API_KEY;
}

export function isResendConfigured(key = getResendApiKey()): boolean {
  return Boolean(key) && !isResendPlaceholderApiKey(key);
}

export function getResendFromEmail(): string {
  return process.env.RESEND_FROM_EMAIL?.trim() || DEFAULT_RESEND_FROM;
}

export function getResendToEmail(): string {
  return process.env.RESEND_TO_EMAIL?.trim() || DEFAULT_RESEND_TO;
}

export function getResendClient(apiKey = getResendApiKey()): Resend {
  if (!isResendConfigured(apiKey)) {
    throw new Error(
      "RESEND_API_KEY is missing. Replace re_xxxxxxxxx with your real API key."
    );
  }
  return new Resend(apiKey);
}

export async function sendEmail(
  input: SendEmailInput = {},
  client?: ResendEmailClient
): Promise<SendEmailResult> {
  try {
    const resend = client ?? getResendClient();
    const { data, error } = await resend.emails.send({
      from: input.from ?? getResendFromEmail(),
      to: input.to ?? getResendToEmail(),
      subject: input.subject ?? FIRST_EMAIL_SUBJECT,
      html: input.html ?? FIRST_EMAIL_HTML,
    });

    if (error) {
      return { ok: false, message: error.message };
    }
    if (!data?.id) {
      return { ok: false, message: "Resend did not return an email id." };
    }
    return { ok: true, id: data.id };
  } catch (err) {
    return {
      ok: false,
      message: err instanceof Error ? err.message : "Failed to send email.",
    };
  }
}
