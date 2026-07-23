import { expect, test } from "@playwright/test";

const FEATURE = "[LAND-001]";

function shouldSkipAuthedLandingE2E(): boolean {
  if (process.env.E2E_SKIP_AUTHED === "true") return true;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  const isCi = process.env.CI === "true" || process.env.GITHUB_ACTIONS === "true";

  if (isCi && (!url || url.includes("example.supabase.co"))) {
    return true;
  }

  return false;
}

test.describe(`${FEATURE} Marketing landing (logged out)`, () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test("shows hero and landing spekit hook at /", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator('[data-spekit="landing-page"]')).toBeVisible();
    await expect(
      page.getByRole("heading", {
        name: "اختبر مهاراتك، تتبع إنجازاتك، وحقق التميّز الدراسي",
      })
    ).toBeVisible();
    await expect(page.getByRole("link", { name: "تجربة المنصة مجاناً" })).toBeVisible();
    await expect(page.getByRole("link", { name: "تسجيل الدخول" }).first()).toBeVisible();
  });

  test("primary CTA links to login", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("link", { name: "تجربة المنصة مجاناً" }).click();
    await expect(page).toHaveURL(/\/login/);
  });
});

test.describe(`${FEATURE} Marketing landing (logged in)`, () => {
  test("demo student redirect from / to dashboard", async ({ page }) => {
    test.skip(
      shouldSkipAuthedLandingE2E(),
      "Skipped without live Supabase (set E2E_SKIP_AUTHED=false + real NEXT_PUBLIC_SUPABASE_URL to enable)"
    );

    await page.goto("/login");
    await page.getByRole("tab", { name: "تجربة" }).click();
    await page.locator('[data-spekit="login-demo-student"]').click();
    await page.waitForURL(/\/dashboard/, { timeout: 15_000 });

    await page.goto("/");
    await expect(page).toHaveURL(/\/dashboard/);
  });
});
