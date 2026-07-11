import { expect, test } from "@playwright/test";

const FEATURE = "[TEACH-003]";

test.describe(`${FEATURE} Teacher quiz create route`, () => {
  test("unauthenticated /teacher/quizzes/new redirects to login", async ({
    page,
  }) => {
    await page.goto("/teacher/quizzes/new");

    await expect(page).toHaveURL(/\/login\?from=/);
    await expect(page.locator('[data-spekit="login-form"]')).toBeVisible();
  });
});
