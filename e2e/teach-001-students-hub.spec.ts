import { expect, test } from "@playwright/test";

const FEATURE = "[TEACH-001]";

function shouldSkipAuthed(): boolean {
  if (process.env.E2E_SKIP_AUTHED === "true") return true;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  const isCi = process.env.CI === "true" || process.env.GITHUB_ACTIONS === "true";
  return isCi && (!url || url.includes("example.supabase.co"));
}

test.describe(`${FEATURE} Students hub smoke`, () => {
  test("unauthenticated /teacher/students redirects to login", async ({
    page,
  }) => {
    await page.goto("/teacher/students");
    await expect(page).toHaveURL(/\/login/);
  });
});

test.describe(`${FEATURE} Students hub (authed)`, () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test("teacher sees hub shell after demo login", async ({ page }) => {
    test.skip(
      shouldSkipAuthed(),
      "Needs live Supabase for demo teacher session"
    );

    await page.goto("/login");
    await page.getByRole("tab", { name: "حساب تجريبي" }).click();
    await page.locator('[data-spekit="login-demo-teacher"]').click();
    await page.waitForURL(/\/teacher/, { timeout: 15_000 });

    await page.goto("/teacher/students");
    await expect(
      page.locator('[data-spekit="teacher-students-page"]')
    ).toBeVisible();
    await expect(page.getByText("إدارة الطلاب").first()).toBeVisible();
    await expect(
      page.locator('[data-spekit="add-student-button"]')
    ).toBeVisible();
    await expect(page.locator('[data-spekit="student-search"]')).toBeVisible();
    await expect(page.locator('[data-spekit="student-filters"]')).toBeVisible();
  });
});
