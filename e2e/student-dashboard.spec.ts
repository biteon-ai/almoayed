import { expect, test } from "@playwright/test";

const FEATURE = "[DASH-001]";

test.describe(`${FEATURE} Student dashboard (auth guard)`, () => {
  test("unauthenticated /dashboard redirects to login", async ({ page }) => {
    await page.goto("/dashboard");
    await expect(page).toHaveURL(/\/login/);
  });
});

test.describe(`${FEATURE} Dashboard UI structure`, () => {
  test("login page RTL baseline", async ({ page }) => {
    await page.goto("/login");
    await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
  });

  test("demo student shortcut available for manual QA", async ({ page }) => {
    await page.goto("/login");
    await expect(
      page.locator('[data-spekit="login-demo-student"]')
    ).toBeVisible();
  });
});

test.describe(`${FEATURE} Mobile dashboard density`, () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test("student dashboard shows stats, carousel section, and tabs after login", async ({
    page,
  }) => {
    await page.goto("/login");
    await page.locator('[data-spekit="login-demo-student"]').click();
    await page.waitForURL(/\/dashboard/);

    const dashboard = page.locator('[data-spekit="student-dashboard"]');
    await expect(dashboard).toBeVisible();
    // Stat labels may render in mobile + aside layouts; scope to dashboard and take first
    await expect(dashboard.getByText("المعدل العام").first()).toBeVisible();
    await expect(dashboard.getByText("اختبارات مكتملة").first()).toBeVisible();
    await expect(dashboard.getByText("الاختبارات المتاحة").first()).toBeVisible();
    await expect(page.getByRole("tab", { name: "نتائجي" })).toBeVisible();
    await expect(page.getByRole("tab", { name: "نقاط الضعف" })).toBeVisible();
    await expect(page.getByRole("tab", { name: "أساتذتي" })).toBeVisible();
  });
});
