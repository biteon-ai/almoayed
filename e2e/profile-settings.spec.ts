import { expect, test } from "@playwright/test";

const FEATURE = "[PROFILE-001]";

test.describe(`${FEATURE} Settings page (public auth guard)`, () => {
  test("unauthenticated /settings redirects to login", async ({ page }) => {
    await page.goto("/settings");
    await expect(page).toHaveURL(/\/login/);
  });
});

test.describe(`${FEATURE} Settings UI structure`, () => {
  test("login page still RTL for baseline", async ({ page }) => {
    await page.goto("/login");
    const dir = await page.locator("html").getAttribute("dir");
    expect(dir).toBe("rtl");
  });

  test("login form exposes demo shortcuts for manual settings QA", async ({
    page,
  }) => {
    await page.goto("/login");
    const demoTab = page.getByRole("tab", { name: "حساب تجريبي" });
    await expect(demoTab).toBeVisible({ timeout: 15_000 });
    await demoTab.click();
    await expect(
      page.locator('[data-spekit="login-demo-student"]')
    ).toBeVisible();
    await expect(
      page.locator('[data-spekit="login-demo-teacher"]')
    ).toBeVisible();
  });
});
