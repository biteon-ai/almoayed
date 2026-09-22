import { expect, test } from "@playwright/test";
import { loginAsDemoStudent, shouldSkipLiveSupabase } from "./helpers/demo-login";
import { openFirstStudentQuiz } from "./helpers/open-quiz";

const FEATURE = "[UI-016]";

test.describe(`${FEATURE} Quiz player chrome`, () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test("header, pager, and no taking sidebar after demo login", async ({
    page,
  }) => {
    test.skip(
      shouldSkipLiveSupabase(),
      "Skipped without live Supabase (set E2E_SKIP_AUTHED=false + real NEXT_PUBLIC_SUPABASE_URL to enable)"
    );

    await loginAsDemoStudent(page);

    const dismiss = page.locator('[data-spekit="pwa-install-sheet-dismiss"]');
    if (await dismiss.isVisible()) {
      await dismiss.click();
    }

    await page.goto("/quizzes");
    if (await dismiss.isVisible()) {
      await dismiss.click();
    }
    await openFirstStudentQuiz(page);

    await expect(page.locator('[data-spekit="quiz-player-header"]')).toBeVisible();
    await expect(page.locator('[data-spekit="quiz-exit-button"]')).toBeVisible();
    await expect(page.getByText("التنقل بين الأسئلة")).toHaveCount(0);
    await expect(page.locator('[data-spekit="question-card"]')).toBeVisible();
    await expect(page.locator('[data-spekit="quiz-question-pager"]')).toBeVisible();

    const letterA = page.locator('[data-spekit="question-card"]').getByText("A", {
      exact: true,
    });
    if (await letterA.isVisible()) {
      const row = page
        .locator('[data-spekit="question-card"] .min-h-11')
        .first();
      const box = await row.boundingBox();
      expect(box?.height ?? 0).toBeGreaterThanOrEqual(44);
    }

    const submit = page.locator('[data-spekit="quiz-submit-button"]');
    if (await submit.isVisible()) {
      const cardBox = await page.locator('[data-spekit="question-card"]').boundingBox();
      const barBox = await submit.boundingBox();
      if (cardBox && barBox) {
        expect(barBox.y).toBeGreaterThanOrEqual(cardBox.y - 4);
        expect(barBox.y).toBeLessThan(cardBox.y + cardBox.height);
      }
    }
  });
});
