import { expect, test } from "@playwright/test";

const UI021 = "[UI-021]";
const UI022 = "[UI-022]";

test.describe(`${UI021} ${UI022} Teacher Portal PWA login`, () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test("teacher login shows indigo shell, Home, version, and install CTAs", async ({
    page,
  }) => {
    await page.goto("/teacher/login");

    const brand = page.locator(
      '[data-spekit="teacher-login-brand-header"].sticky'
    );
    await expect(brand).toBeVisible();

    await expect(
      page.locator('[data-spekit="teacher-login-landing-back"]:visible')
    ).toBeVisible();
    await expect(
      page.locator('[data-spekit="teacher-email-login-form"]')
    ).toBeVisible();
    await expect(
      page.locator('[data-spekit="teacher-pwa-install-buttons"]:visible')
    ).toBeVisible({ timeout: 15_000 });
    await expect(
      page.locator('[data-spekit="app-version"]:visible')
    ).toBeVisible();
    await expect(
      page.locator('[data-spekit="app-version"]:visible')
    ).toContainText(/^v\d/);

    const dir = await page.locator("html").getAttribute("dir");
    expect(dir).toBe("rtl");
  });

  test("student login still uses student Spekit install hooks", async ({
    page,
  }) => {
    await page.goto("/login");
    await expect(
      page.locator('[data-spekit="login-brand-header"].sticky')
    ).toBeVisible();
    await expect(
      page.locator('[data-spekit="login-landing-back"]:visible')
    ).toBeVisible();
  });
});
