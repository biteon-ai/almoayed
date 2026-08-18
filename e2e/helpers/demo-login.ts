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

/** Shared demo-student login for authed e2e (FIX-AUTH-001). */
export async function loginAsDemoStudent(page: Page): Promise<void> {
  await openDemoTab(page);
  await page.locator('[data-spekit="login-demo-student"]').click();
  await page.waitForURL(/\/dashboard/, { timeout: 20_000 });
  await expect(page).toHaveURL(/\/dashboard/);
}

export async function loginAsDemoTeacher(page: Page): Promise<void> {
  await openDemoTab(page);
  await page.locator('[data-spekit="login-demo-teacher"]').click();
  await page.waitForURL(/\/teacher\/dashboard/, { timeout: 20_000 });
  await expect(page).toHaveURL(/\/teacher\/dashboard/);
}

/** AUTH-008: resolve demo teacher join code after ensuring seed via demo login. */
export async function resolveDemoTeacherJoinCode(page: Page): Promise<string> {
  await loginAsDemoTeacher(page);
  const inviteCard = page.locator('[data-spekit="teacher-code-card"]');
  await expect(inviteCard).toBeVisible({ timeout: 15_000 });
  const code = await inviteCard.locator("span.font-mono.font-bold").textContent();
  const trimmed = code?.trim();
  expect(trimmed).toBeTruthy();
  return trimmed!;
}
