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

    await expect(
      page.locator('[data-spekit="student-dashboard"]')
    ).toBeVisible();
    await expect(page.getByText("المعدل العام")).toBeVisible();
    await expect(page.getByText("اختبارات مكتملة")).toBeVisible();
    await expect(page.getByText("الاختبارات المتاحة")).toBeVisible();
    await expect(page.getByRole("tab", { name: "نتائجي" })).toBeVisible();
    await expect(page.getByRole("tab", { name: "نقاط الضعف" })).toBeVisible();
    await expect(page.getByRole("tab", { name: "أساتذتي" })).toBeVisible();
  });
});
