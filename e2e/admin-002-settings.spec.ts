import { expect, test } from "@playwright/test";

const FEATURE = "[ADMIN-002]";

test.describe(`${FEATURE} platform settings access`, () => {
  test("unauthenticated /admin/settings redirects to admin login", async ({
    page,
  }) => {
    await page.goto("/admin/settings");
    await expect(page).toHaveURL(/\/admin\/login/);
  });

  test("public login does not expose the admin settings panel or test code field", async ({
    page,
  }) => {
    await page.goto("/login");
    await expect(page.locator('[data-spekit="login-form"]')).toBeVisible();
    await expect(
      page.locator('[data-spekit="admin-platform-settings"]')
    ).toHaveCount(0);
    await expect(
      page.locator('[data-spekit="admin-fixed-otp-code"]')
    ).toHaveCount(0);
  });

  test("login page stays RTL Arabic", async ({ page }) => {
    await page.goto("/login");
    const dir = await page.locator("html").getAttribute("dir");
    expect(dir).toBe("rtl");
  });
});
