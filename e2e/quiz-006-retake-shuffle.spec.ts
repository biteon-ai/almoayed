import { expect, test } from "@playwright/test";
import { loginAsDemoStudent, shouldSkipLiveSupabase } from "./helpers/demo-login";

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
    } else {
      await page.goto("/quizzes");
      await dismissA2hs(page);
      const startQuiz = page.getByRole("link", { name: "ابدأ الاختبار الآن" }).first();
      const continueQuiz = page.getByRole("link", { name: "متابعة الاختبار" }).first();
      if (await startQuiz.isVisible()) {
        await startQuiz.click();
      } else if (await continueQuiz.isVisible()) {
        await continueQuiz.click();
      } else {
        test.skip(true, "No quiz available for the demo student");
      }
    }

    await expect(page).toHaveURL(/\/quiz\//, { timeout: 15_000 });
    await dismissA2hs(page);
    await expect(page.locator('[data-spekit="question-card"]')).toBeVisible({
      timeout: 15_000,
    });
    await expect(
      page.locator('[data-spekit="question-card"] [data-state="checked"]')
    ).toHaveCount(0);
  });
});
