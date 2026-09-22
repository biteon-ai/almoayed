import { expect, test } from "@playwright/test";
import {
  resolveDemoTeacherJoinCode,
  shouldSkipLiveSupabase,
} from "./helpers/demo-login";

const AUTH = "[AUTH-008]";

test.describe(`${AUTH} public trial join page`, () => {
  test("join page renders Arabic form for demo teacher code", async ({
    page,
    context,
  }) => {
    test.setTimeout(90_000);
    test.skip(
      shouldSkipLiveSupabase(),
      "Needs live Supabase for demo teacher lookup"
    );

    const teacherCode = await resolveDemoTeacherJoinCode(page);
    await context.clearCookies();
    await page.goto(`/join/${teacherCode}`);

    await expect(page.locator('[data-spekit="join-form"]')).toBeVisible({
      timeout: 15000,
    });
    await expect(page.getByText("الاسم الأول")).toBeVisible();
    await expect(page.getByText("الكنية")).toBeVisible();
    await expect(page.getByText("المرحلة الدراسية")).toBeVisible();
    await expect(page.locator('[data-spekit="join-submit"]')).toBeVisible();

    const dir = await page.locator("html").getAttribute("dir");
    expect(dir).toBe("rtl");
  });

  test("invalid join code shows Arabic error", async ({ page }) => {
    await page.goto("/join/not-a-valid-code-xyz");

    await expect(page.getByText("الرابط غير صالح")).toBeVisible({
      timeout: 15000,
    });
  });
});
