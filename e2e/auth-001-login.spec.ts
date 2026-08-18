import { expect, test } from "@playwright/test";

const AUTH = "[AUTH-001]";
const UI = "[UI-001]";

test.describe(`${AUTH} WhatsApp Login Session Flow (public)`, () => {
  test("login form renders with Spekit hooks and RTL layout", async ({ page }) => {
    await page.goto("/login");

    await expect(page.locator('[data-spekit="login-form"]')).toBeVisible();
    await expect(
      page.locator('[data-spekit="login-whatsapp-field"]')
    ).toBeVisible();
    await expect(page.locator('[data-spekit="login-submit"]')).toBeVisible();

    const dir = await page.locator("html").getAttribute("dir");
    expect(dir).toBe("rtl");
  });

  test(`${UI} submit button meets mobile touch target (min 40px height)`, async ({
    page,
  }) => {
    await page.goto("/login");
    const submit = page.locator('[data-spekit="login-submit"]');
    await expect(submit).toBeVisible();

    const box = await submit.boundingBox();
    expect(box).not.toBeNull();
    expect(box!.height).toBeGreaterThanOrEqual(40);
  });

  test("demo student shortcut is present", async ({ page }) => {
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
