import { expect, test } from "@playwright/test";

const FEATURE = "[DASH-001]";

/**
 * Authed dashboard needs a reachable Supabase.
 * CI smoke uses placeholder example.supabase.co and sets E2E_SKIP_AUTHED=true.
 */
function shouldSkipAuthedDashboardE2E(): boolean {
  if (process.env.E2E_SKIP_AUTHED === "true") return true;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  const isCi = process.env.CI === "true" || process.env.GITHUB_ACTIONS === "true";

  if (isCi && (!url || url.includes("example.supabase.co"))) {
    return true;
  }

  return false;
}

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
    await page.getByRole("tab", { name: "حساب تجريبي" }).click();
    await expect(
      page.locator('[data-spekit="login-demo-student"]')
    ).toBeVisible();
  });
});

test.describe(`${FEATURE} Mobile dashboard density`, () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test("student quizzes and results pages available after login", async ({
    page,
  }) => {
    test.skip(
      shouldSkipAuthedDashboardE2E(),
      "Skipped without live Supabase (set E2E_SKIP_AUTHED=false + real NEXT_PUBLIC_SUPABASE_URL to enable)"
    );

    await page.goto("/login");
    await page.getByRole("tab", { name: "حساب تجريبي" }).click();
    await page.locator('[data-spekit="login-demo-student"]').click();
    await page.waitForURL(/\/dashboard/, { timeout: 15_000 });

    await page.goto("/quizzes");
    await expect(page.locator('[data-spekit="student-quizzes-page"]')).toBeVisible();
    await expect(page.getByText("الاختبارات المتاحة").first()).toBeVisible();

    await page.goto("/results");
    await expect(page.locator('[data-spekit="student-results-page"]')).toBeVisible();
    await expect(page.getByText("نتائجي").first()).toBeVisible();
  });
});
