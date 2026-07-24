import { expect, type Page } from "@playwright/test";

/** Shared demo-student login for authed e2e (FIX-AUTH-001). */
export async function loginAsDemoStudent(page: Page): Promise<void> {
  await page.goto("/login");
  await page.getByRole("tab", { name: "حساب تجريبي" }).click();
  await page.locator('[data-spekit="login-demo-student"]').click();
  await page.waitForURL(/\/dashboard/, { timeout: 20_000 });
  await expect(page).toHaveURL(/\/dashboard/);
}

export async function loginAsDemoTeacher(page: Page): Promise<void> {
  await page.goto("/login");
  await page.getByRole("tab", { name: "حساب تجريبي" }).click();
  await page.locator('[data-spekit="login-demo-teacher"]').click();
  await page.waitForURL(/\/teacher\/dashboard/, { timeout: 20_000 });
  await expect(page).toHaveURL(/\/teacher\/dashboard/);
}
