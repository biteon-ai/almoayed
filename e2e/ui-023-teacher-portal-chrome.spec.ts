import { expect, test } from "@playwright/test";

const UI = "[UI-023]";

test.describe(`${UI} Teacher portal mobile chrome`, () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test("teacher login still reachable; portal chrome requires auth", async ({
    page,
  }) => {
    // Unauthenticated users are redirected away from portal hubs.
    await page.goto("/teacher/dashboard");
    await expect(page).not.toHaveURL(/\/teacher\/dashboard$/);

    await page.goto("/teacher/login");
    await expect(
      page.locator('[data-spekit="teacher-login-brand-header"].sticky')
    ).toBeVisible();
  });
});
