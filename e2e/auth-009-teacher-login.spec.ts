import { expect, test } from "@playwright/test";

const AUTH = "[AUTH-009]";

test.describe(`${AUTH} teacher login recovery (public)`, () => {
  test("back control is visible, RTL, and navigates to main login", async ({
    page,
  }) => {
    await page.goto("/teacher/login");
    const dir = await page.locator("html").getAttribute("dir");
    expect(dir).toBe("rtl");

    const back = page.locator('[data-spekit="teacher-login-back"]');
    await expect(back).toBeVisible();
    await expect(back).toHaveText(/العودة لتسجيل الدخول الرئيسي/);

    const box = await back.boundingBox();
    expect(box).not.toBeNull();
    expect(box!.height).toBeGreaterThanOrEqual(40);

    await back.click();
    await expect(page).toHaveURL(/\/login$/);
    await expect(page.locator('[data-spekit="login-form"]')).toBeVisible();
  });

  test("login mode keeps one brand primary and quiet recovery links", async ({
    page,
  }) => {
    await page.goto("/teacher/login");
    await expect(page.getByRole("heading", { name: "دخول المدرس" })).toBeVisible();
    await expect(
      page.locator('[data-spekit="teacher-email-login-form"]')
    ).toBeVisible();

    const primary = page.getByRole("button", { name: "دخول المدرس" });
    await expect(primary).toBeVisible();
    const primaryBox = await primary.boundingBox();
    expect(primaryBox).not.toBeNull();
    expect(primaryBox!.height).toBeGreaterThanOrEqual(40);

    const forgot = page.locator('[data-spekit="teacher-forgot-password-link"]');
    await expect(forgot).toBeVisible();
    await expect(forgot).not.toHaveClass(/bg-brand-600/);

    const magic = page.locator('[data-spekit="teacher-magic-link-cta"]');
    await expect(magic).toBeVisible();
    await expect(magic).not.toHaveClass(/bg-brand-600/);
  });

  test("forgot and magic modes show request forms", async ({ page }) => {
    await page.goto("/teacher/login");
    await page.locator('[data-spekit="teacher-forgot-password-link"]').click();
    await expect(
      page.locator('[data-spekit="teacher-forgot-password-form"]')
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: "إرسال رابط إعادة التعيين" })
    ).toBeVisible();

    await page.getByRole("button", { name: "العودة لتسجيل الدخول" }).click();
    await page.locator('[data-spekit="teacher-magic-link-cta"]').click();
    await expect(
      page.locator('[data-spekit="teacher-magic-link-form"]')
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: "إرسال رابط الدخول" })
    ).toBeVisible();
  });

  test("reset and magic pages without a token stay public and show Arabic errors", async ({
    page,
  }) => {
    await page.goto("/teacher/reset");
    await expect(page.locator('[data-spekit="teacher-reset-form"]')).toBeVisible();
    await expect(page.getByText(/رابط إعادة التعيين غير صالح/)).toBeVisible();

    await page.goto("/teacher/magic");
    await expect(
      page.locator('[data-spekit="teacher-magic-consume"]')
    ).toBeVisible();
    await expect(page.getByText(/رابط الدخول غير صالح/)).toBeVisible();
  });
});
