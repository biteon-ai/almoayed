import { expect, test } from "@playwright/test";
import { loginAsDemoStudent, shouldSkipLiveSupabase } from "./helpers/demo-login";
import { openFirstStudentQuiz } from "./helpers/open-quiz";

const FEATURE = "[QUIZ-006]";

async function dismissA2hs(page: import("@playwright/test").Page) {
  const dismiss = page.locator('[data-spekit="pwa-install-sheet-dismiss"]');
  if (await dismiss.isVisible()) {
    await dismiss.click();
  }
}

test.describe(`${FEATURE} Retake reset`, () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test("retake or start opens a blank player with no pre-selected choice", async ({
    page,
  }) => {
    test.skip(
      shouldSkipLiveSupabase(),
      "Skipped without live Supabase (set E2E_SKIP_AUTHED=false + real NEXT_PUBLIC_SUPABASE_URL to enable)"
    );

    await loginAsDemoStudent(page);
    await dismissA2hs(page);

    await page.goto("/results");
    await dismissA2hs(page);

    const retake = page.locator('[data-spekit="quiz-retake-cta"]').first();
    if (await retake.isVisible()) {
      await retake.click();
      await expect(page).toHaveURL(/\/quiz\//, { timeout: 15_000 });
    } else {
      await page.goto("/quizzes");
      await dismissA2hs(page);
      await openFirstStudentQuiz(page);
    }

    await dismissA2hs(page);
    await expect(page.locator('[data-spekit="question-card"]')).toBeVisible({
      timeout: 15_000,
    });
    await expect(
      page.locator('[data-spekit="question-card"] [data-state="checked"]')
    ).toHaveCount(0);
  });
});
