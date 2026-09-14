import { describe, expect, it, vi } from "vitest";
import {
  DEFAULT_RESEND_FROM,
  DEFAULT_RESEND_TO,
  FIRST_EMAIL_HTML,
  FIRST_EMAIL_SUBJECT,
  RESEND_PLACEHOLDER_API_KEY,
  getResendClient,
  isResendConfigured,
  isResendPlaceholderApiKey,
  sendEmail,
  type ResendEmailClient,
} from "@/lib/resend";

const FEATURE = "[EMAIL-001]";

function withEnv(overrides: Record<string, string | undefined>, run: () => void) {
  const previous: Record<string, string | undefined> = {};
  for (const [key, value] of Object.entries(overrides)) {
    previous[key] = process.env[key];
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
  }
  try {
    run();
  } finally {
    for (const [key, value] of Object.entries(previous)) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
  }
}

describe(`${FEATURE} Resend config`, () => {
  it("rejects the dashboard placeholder key", () => {
    expect(isResendPlaceholderApiKey(RESEND_PLACEHOLDER_API_KEY)).toBe(true);
    expect(isResendPlaceholderApiKey("re_live_realkey123")).toBe(false);
  });

  it("isResendConfigured is false for missing or placeholder keys", () => {
    withEnv({ RESEND_API_KEY: undefined }, () => {
      expect(isResendConfigured()).toBe(false);
    });
    withEnv({ RESEND_API_KEY: RESEND_PLACEHOLDER_API_KEY }, () => {
      expect(isResendConfigured()).toBe(false);
    });
  });

  it("isResendConfigured is true for a real-looking key", () => {
    withEnv({ RESEND_API_KEY: "re_live_realkey123" }, () => {
      expect(isResendConfigured()).toBe(true);
    });
  });

  it("getResendClient throws until the placeholder is replaced", () => {
    withEnv({ RESEND_API_KEY: RESEND_PLACEHOLDER_API_KEY }, () => {
      expect(() => getResendClient()).toThrow(/re_xxxxxxxxx/);
    });
  });
});

describe(`${FEATURE} sendEmail`, () => {
  it("sends the Hello World payload to almoayed@biteon.nl", async () => {
    const send = vi.fn().mockResolvedValue({
      data: { id: "email_test_001" },
      error: null,
    });
    const client: ResendEmailClient = { emails: { send } };

    const result = await sendEmail({}, client);

    expect(result).toEqual({ ok: true, id: "email_test_001" });
    expect(send).toHaveBeenCalledWith({
      from: DEFAULT_RESEND_FROM,
      to: DEFAULT_RESEND_TO,
      subject: FIRST_EMAIL_SUBJECT,
      html: FIRST_EMAIL_HTML,
    });
  });

  it("returns the Resend error message instead of throwing", async () => {
    const client: ResendEmailClient = {
      emails: {
        send: vi.fn().mockResolvedValue({
          data: null,
          error: { message: "Invalid API key", name: "validation_error" },
        }),
      },
    };

    await expect(sendEmail({}, client)).resolves.toEqual({
      ok: false,
      message: "Invalid API key",
    });
  });
});
