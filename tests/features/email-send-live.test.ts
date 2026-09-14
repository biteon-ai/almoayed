import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { isResendConfigured, sendEmail } from "@/lib/resend";
import { resetEmailHtml } from "@/lib/teacher-login-recovery";
import { TEACHER_LOGIN_MESSAGES } from "@/lib/teacher-login-messages";
import { getAppUrl } from "@/lib/app-origin";

const FEATURE = "[EMAIL-001]";

function loadLocalEnv() {
  const envPath = resolve(process.cwd(), ".env");
  if (!existsSync(envPath)) return;
  for (const line of readFileSync(envPath, "utf8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq < 1) continue;
    const key = trimmed.slice(0, eq);
    let value = trimmed.slice(eq + 1);
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (process.env[key] === undefined) process.env[key] = value;
  }
}

loadLocalEnv();

const to = process.env.SEND_TEST_TO?.trim();
const live = process.env.SEND_TEST_EMAIL === "1" && Boolean(to);

describe.skipIf(!live)(`${FEATURE} live branded send`, () => {
  it("sends a reset-template preview to SEND_TEST_TO", async () => {
    expect(isResendConfigured()).toBe(true);
    const origin = getAppUrl();
    const html = resetEmailHtml(
      "عماد",
      `${origin}/teacher/reset?token=preview-only`,
      origin
    );
    const result = await sendEmail({
      to,
      subject: `تجربة قالب البريد — ${TEACHER_LOGIN_MESSAGES.resetSubject}`,
      html,
    });
    expect(result.ok, result.ok ? "" : result.message).toBe(true);
    if (result.ok) {
      process.stdout.write(`sent ${result.id} -> ${to}\n`);
    }
  }, 20_000);
});
