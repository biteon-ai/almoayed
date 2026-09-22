import { expect, type Page } from "@playwright/test";

/** Skip e2e that need a live Supabase project (not CI placeholder). */
export function shouldSkipLiveSupabase(): boolean {
  if (process.env.E2E_SKIP_AUTHED === "true") return true;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  const isCi =
    process.env.CI === "true" || process.env.GITHUB_ACTIONS === "true";
  return isCi && (!url || url.includes("example.supabase.co"));
}

async function openDemoTab(page: Page): Promise<void> {
  await page.goto("/login");
  const tab = page.getByRole("tab", { name: "حساب تجريبي" });
  await expect(tab).toBeVisible({ timeout: 15_000 });
  await tab.click();
}

const DEMO_LOGIN_ERROR =
  /ما قدرنا نتحقق من حسابك|صار في مشكلة بالاتصال|الحسابات التجريبية غير مفعّلة/;

/**
 * Demo one-click login with retries — parallel e2e workers can briefly flake
 * on Supabase profile fetch for the shared demo identities.
 */
async function loginDemoWithRetry(
  page: Page,
  opts: {
    spekit: string;
    url: RegExp;
    readyTextGone?: string;
  }
): Promise<void> {
  const maxAttempts = 3;
  let lastError: unknown;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      await openDemoTab(page);
      await page.locator(`[data-spekit="${opts.spekit}"]`).click();

      const loginError = page
        .getByRole("alert")
        .filter({ hasText: DEMO_LOGIN_ERROR });

      const result = await Promise.race([
        page.waitForURL(opts.url, { timeout: 25_000 }).then(() => "ok" as const),
        loginError
          .waitFor({ state: "visible", timeout: 25_000 })
          .then(() => "error" as const)
          .catch(() => null),
      ]);

      if (result === "error") {
        throw new Error(
          `Demo login failed (attempt ${attempt}): ${await loginError.textContent()}`
        );
      }

      if (result !== "ok") {
        await expect(page).toHaveURL(opts.url, { timeout: 25_000 });
      }

      if (opts.readyTextGone) {
        await expect(page.getByText(opts.readyTextGone)).toHaveCount(0, {
          timeout: 30_000,
        });
      }
      return;
    } catch (error) {
      lastError = error;
      if (attempt === maxAttempts) break;
      await page.waitForTimeout(500 * attempt);
    }
  }

  throw lastError instanceof Error
    ? lastError
    : new Error("Demo login failed after retries");
}

/** Shared demo-student login for authed e2e (FIX-AUTH-001). */
export async function loginAsDemoStudent(page: Page): Promise<void> {
  await loginDemoWithRetry(page, {
    spekit: "login-demo-student",
    url: /\/dashboard/,
    readyTextGone: "جاري فتح لوحة الطالب…",
  });
}

export async function loginAsDemoTeacher(page: Page): Promise<void> {
  await loginDemoWithRetry(page, {
    spekit: "login-demo-teacher",
    url: /\/teacher\/dashboard/,
    readyTextGone: "جاري فتح لوحة الأستاذ…",
  });
}

/** AUTH-008: resolve demo teacher join code after ensuring seed via demo login. */
export async function resolveDemoTeacherJoinCode(page: Page): Promise<string> {
  await loginAsDemoTeacher(page);
  const inviteCard = page.locator('[data-spekit="teacher-code-card"]');
  await expect(inviteCard).toBeVisible({ timeout: 20_000 });
  const code = await inviteCard.locator("span.font-mono.font-bold").textContent();
  const trimmed = code?.trim();
  expect(trimmed).toBeTruthy();
  return trimmed!;
}
