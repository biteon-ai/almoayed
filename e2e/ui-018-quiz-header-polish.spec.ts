import { expect, test } from "@playwright/test";
import { loginAsDemoStudent, shouldSkipLiveSupabase } from "./helpers/demo-login";
import { openFirstStudentQuiz } from "./helpers/open-quiz";

const FEATURE = "[UI-018]";

async function dismissA2hs(page: import("@playwright/test").Page) {
  const dismiss = page.locator('[data-spekit="pwa-install-sheet-dismiss"]');
  if (await dismiss.isVisible()) {
    await dismiss.click();
  }
}

async function openFirstQuiz(page: import("@playwright/test").Page) {
  await loginAsDemoStudent(page);
  await dismissA2hs(page);
  await page.goto("/quizzes");
  await dismissA2hs(page);
  await openFirstStudentQuiz(page);
  await dismissA2hs(page);
}

test.describe(`${FEATURE} Quiz header polish`, () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test("compact تسليم left of pager, gated until complete, timer bar, كل الأسئلة", async ({
    page,
  }) => {
    test.skip(
      shouldSkipLiveSupabase(),
      "Skipped without live Supabase (set E2E_SKIP_AUTHED=false + real NEXT_PUBLIC_SUPABASE_URL to enable)"
    );

    await openFirstQuiz(page);

    await expect(page.locator('[data-spekit="quiz-player-header"]')).toBeVisible();
    await expect(page.locator('[data-spekit="question-card"]')).toBeVisible();

    const submit = page.locator('[data-spekit="quiz-submit-button"]');
    const pager = page.locator('[data-spekit="quiz-question-pager"]');
    const confirm = page.locator('[data-spekit="quiz-submit-confirm"]');
    const unanswered = page.locator('[data-spekit="quiz-unanswered-alert"]');
    const jump = page.locator('[data-spekit="quiz-all-questions"]');
    const timer = page.locator('[data-spekit="quiz-timer"]');
    const timerBar = page.locator('[data-spekit="quiz-timer-bar"]');

    if (await submit.isVisible()) {
      await expect(pager).toBeVisible();
      const submitBox = await submit.boundingBox();
      const pagerBox = await pager.boundingBox();
      if (submitBox && pagerBox) {
        expect(
          submitBox.x,
          `${FEATURE} compact submit must sit to the physical left of the stepper`
        ).toBeLessThan(pagerBox.x);
        expect(Math.abs(submitBox.y - pagerBox.y)).toBeLessThan(24);
      }

      if (await submit.isDisabled()) {
        await expect(submit).toContainText("تسليم");
        await expect(unanswered).toHaveCount(0);
        await expect(confirm).toBeHidden();
      }

      const choice = page
        .locator('[data-spekit="question-card"] [data-slot="radio-group"] .min-h-11')
        .first();
      for (let i = 0; i < 60; i += 1) {
        if (await submit.isEnabled()) break;
        if (await choice.isVisible()) {
          await choice.click();
        }
        await page.waitForTimeout(450);
      }

      await expect(submit).toBeEnabled({ timeout: 8_000 });
      await submit.click();
      await expect(unanswered).toHaveCount(0);
      await expect(confirm).toBeVisible({ timeout: 5_000 });
      await expect(confirm.getByText("هل أنت متأكد من تسليم الإجابات؟")).toBeVisible();
      await expect(confirm.getByText("لا يمكنك التراجع بعد التأكيد.")).toBeVisible();
      await page.getByRole("button", { name: "إلغاء" }).click();
      await expect(page).toHaveURL(/\/quiz\//);
      await expect(confirm).toBeHidden();
    }

    if (await timer.isVisible()) {
      await expect(timerBar).toBeVisible();
      const now = Number(await timerBar.getAttribute("aria-valuenow"));
      expect(now).toBeGreaterThanOrEqual(0);
      expect(now).toBeLessThanOrEqual(100);
    } else {
      await expect(timerBar).toHaveCount(0);
    }

    await expect(jump).toBeVisible();
    await jump.click();
    const jumpSheet = page.locator('[data-spekit="quiz-jump-sheet"]');
    await expect(jumpSheet).toBeVisible();
    await page.getByRole("button", { name: "إغلاق" }).click();
    await expect(jumpSheet).toBeHidden();
  });
});
