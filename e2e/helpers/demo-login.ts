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
  await page.goto("/login", { waitUntil: "domcontentloaded" });
  const tab = page.getByRole("tab", { name: "حساب تجريبي" });
  await expect(tab).toBeVisible({ timeout: 20_000 });
  await tab.click();
}

const DEMO_LOGIN_ERROR =
  /ما قدرنا نتحقق من حسابك|صار في مشكلة بالاتصال|الحسابات التجريبية غير مفعّلة/;

async function sleep(page: Page, ms: number): Promise<void> {
  if (page.isClosed()) return;
  await page.waitForTimeout(ms);
}

/**
 * Demo one-click login with retries — parallel e2e workers can briefly flake
 * on Supabase profile fetch (AbortError / SUPABASE_PROFILE_FETCH_FAILED).
 */
async function loginDemoWithRetry(
  page: Page,
  opts: {
    spekit: string;
    url: RegExp;
    readyTextGone?: string;
  }
): Promise<void> {
  const maxAttempts = 5;
  let lastError: unknown;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    if (page.isClosed()) {
      throw lastError instanceof Error
        ? lastError
        : new Error("Demo login aborted: page closed");
    }

    try {
      await openDemoTab(page);
      const cta = page.locator(`[data-spekit="${opts.spekit}"]`);
      await expect(cta).toBeVisible({ timeout: 15_000 });
      await cta.click();

      const loginError = page
        .getByRole("alert")
        .filter({ hasText: DEMO_LOGIN_ERROR });

      // Poll for either success navigation or a visible auth error (no dangling races).
      const deadline = Date.now() + 30_000;
      let landed = false;
      while (Date.now() < deadline) {
        if (page.isClosed()) {
          throw new Error("Demo login aborted: page closed");
        }
        if (opts.url.test(page.url())) {
          landed = true;
          break;
        }
        if (await loginError.isVisible().catch(() => false)) {
          const message =
            (await loginError.textContent().catch(() => null)) ?? "";
          throw new Error(
            `Demo login failed (attempt ${attempt}/${maxAttempts}): ${message}`
          );
        }
        await sleep(page, 250);
      }

      if (!landed) {
        await expect(page).toHaveURL(opts.url, { timeout: 5_000 });
      } else {
        await expect(page).toHaveURL(opts.url);
      }

      if (opts.readyTextGone) {
        await expect(page.getByText(opts.readyTextGone)).toHaveCount(0, {
          timeout: 30_000,
        });
      }
      return;
    } catch (error) {
      lastError = error;
      if (attempt === maxAttempts || page.isClosed()) break;
      // Back off harder under parallel workers (AbortError storms).
      await sleep(page, 750 * attempt);
      await page.context().clearCookies().catch(() => undefined);
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
