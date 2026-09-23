import { expect, test } from "@playwright/test";
import { loginAsDemoStudent, shouldSkipLiveSupabase } from "./helpers/demo-login";
import { openFirstStudentQuiz } from "./helpers/open-quiz";

const FEATURE = "[UI-017]";

async function dismissA2hs(page: import("@playwright/test").Page) {
  const dismiss = page.locator('[data-spekit="pwa-install-sheet-dismiss"]');
  if (await dismiss.isVisible()) {
    await dismiss.click();
  }
}

test.describe(`${FEATURE} Quiz nav and gated submit`, () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test("Q1 السابق disabled, التالي advances, submit gated then confirm cancel stays", async ({
    page,
  }) => {
    test.setTimeout(120_000);
    test.skip(
      shouldSkipLiveSupabase(),
      "Skipped without live Supabase (set E2E_SKIP_AUTHED=false + real NEXT_PUBLIC_SUPABASE_URL to enable)"
    );

    await loginAsDemoStudent(page);
    await dismissA2hs(page);
    await page.goto("/quizzes");
    await dismissA2hs(page);
    await openFirstStudentQuiz(page, { requireTaking: true });
    await dismissA2hs(page);

    await expect(page.locator('[data-spekit="quiz-player-header"]')).toBeVisible();
    await expect(page.locator('[data-spekit="question-card"]')).toBeVisible();

    const pager = page.locator('[data-spekit="quiz-question-pager"]');
    const prev = pager.getByRole("button", { name: "السؤال السابق" });
    const next = pager.getByRole("button", { name: "السؤال التالي" });
    await expect(pager).toBeVisible();
    await expect(page.getByRole("button", { name: "التالي", exact: true })).toHaveCount(0);
    await expect(page.getByRole("button", { name: "السابق", exact: true })).toHaveCount(0);
    await expect(prev).toBeVisible();
    await expect(prev).toBeDisabled();
    const prevBox = await prev.boundingBox();
    const nextBox = await next.boundingBox();
    if (prevBox && nextBox) {
      expect(nextBox.x).toBeLessThan(prevBox.x);
    }

    const currentStep = page.locator(
      '[data-spekit="quiz-question-pager"] [aria-current="step"]'
    );

    if (await next.isEnabled()) {
      await next.click();
      await expect(currentStep).toHaveAttribute("aria-label", "السؤال 2");
      await expect(prev).toBeEnabled();
      await prev.click();
      await expect(currentStep).toHaveAttribute("aria-label", "السؤال 1");
    }

    const submit = page.locator('[data-spekit="quiz-submit-button"]');
    await expect(submit).toBeVisible();
    await expect(submit).toContainText("تسليم");
    const unansweredEarly = page.locator('[data-spekit="quiz-unanswered-alert"]');
    if (await submit.isDisabled()) {
      await expect(unansweredEarly).toHaveCount(0);
      await expect(page.locator('[data-spekit="quiz-submit-confirm"]')).toBeHidden();
    }
    const progress = page.locator('[data-spekit="quiz-progress"]');
    const card = page.locator('[data-spekit="question-card"]');
    const header = page.locator('[data-spekit="quiz-player-header"]');
    const jump = page.getByRole("button", { name: "كل الأسئلة" });

    await page.evaluate(() => window.scrollTo(0, 0));
    await expect(pager).toBeVisible();
    await expect(progress).toBeVisible();
    const pagerNext = pager.getByRole("button", { name: "السؤال التالي" });
    const pagerPrev = pager.getByRole("button", { name: "السؤال السابق" });
    const pagerNextBox = await pagerNext.boundingBox();
    const pagerPrevBox = await pagerPrev.boundingBox();
    if (pagerNextBox && pagerPrevBox) {
      expect(pagerNextBox.x).toBeLessThan(pagerPrevBox.x);
    }
    const q1Pill = pager.getByRole("button", { name: "السؤال 1" });
    const q2Pill = pager.getByRole("button", { name: "السؤال 2" });
    if ((await q1Pill.isVisible()) && (await q2Pill.isVisible())) {
      const q1Box = await q1Pill.boundingBox();
      const q2Box = await q2Pill.boundingBox();
      if (q1Box && q2Box) {
        expect(q2Box.x).toBeLessThan(q1Box.x);
      }
    }
    const pagerBox = await pager.boundingBox();
    const cardBox = await card.boundingBox();
    if (pagerBox && cardBox) {
      expect(pagerBox.y).toBeGreaterThanOrEqual(cardBox.y - 1);
      expect(pagerBox.y + pagerBox.height).toBeLessThanOrEqual(
        cardBox.y + cardBox.height + 1
      );
    }

    const headerBox = await header.boundingBox();
    const jumpBox = await jump.boundingBox();
    if (headerBox && jumpBox) {
      expect(jumpBox.y).toBeGreaterThanOrEqual(headerBox.y - 2);
      expect(jumpBox.y + jumpBox.height).toBeLessThanOrEqual(
        headerBox.y + headerBox.height + 2
      );
    }

    if (await pager.isVisible() && (await progress.isVisible())) {
      const pagerBox = await pager.boundingBox();
      const progressBox = await progress.boundingBox();
      if (pagerBox && progressBox) {
        expect(progressBox.y).toBeGreaterThanOrEqual(
          pagerBox.y + pagerBox.height - 2
        );
      }
      if (progressBox && cardBox) {
        expect(progressBox.y).toBeGreaterThanOrEqual(cardBox.y - 1);
        expect(progressBox.y + progressBox.height).toBeLessThanOrEqual(
          cardBox.y + cardBox.height + 1
        );
      }
      if (pagerBox && jumpBox) {
        const overlapX = !(
          pagerBox.x + pagerBox.width <= jumpBox.x ||
          jumpBox.x + jumpBox.width <= pagerBox.x
        );
        const overlapY = !(
          pagerBox.y + pagerBox.height <= jumpBox.y ||
          jumpBox.y + jumpBox.height <= pagerBox.y
        );
        expect(overlapX && overlapY).toBe(false);
      }
    }

    const choice = page
      .locator('[data-spekit="question-card"] [data-slot="radio-group"] .min-h-11')
      .first();
    if (await next.isEnabled() && (await choice.isVisible())) {
      await choice.click();
      await expect(currentStep).toHaveAttribute("aria-label", "السؤال 2", {
        timeout: 2_000,
      });
    }

    for (let i = 0; i < 60; i += 1) {
      if (await submit.isEnabled()) break;
      if (await choice.isVisible()) {
        await choice.click();
      }
      await page.waitForTimeout(450);
    }

    await expect(submit).toBeVisible({ timeout: 5_000 });
    const pagerBoxAfter = await pager.boundingBox();
    const submitBox = await submit.boundingBox();
    if (pagerBoxAfter && submitBox) {
      expect(submitBox.x).toBeLessThan(pagerBoxAfter.x);
      expect(Math.abs(submitBox.y - pagerBoxAfter.y)).toBeLessThan(24);
    }

    await expect(submit).toBeEnabled();
    await submit.click();
    const unanswered = page.locator('[data-spekit="quiz-unanswered-alert"]');
    const confirm = page.locator('[data-spekit="quiz-submit-confirm"]');
    await expect(unanswered).toHaveCount(0);
    await expect(confirm).toBeVisible({ timeout: 5_000 });
    await expect(confirm.getByText("هل أنت متأكد من تسليم الإجابات؟")).toBeVisible();
    await expect(confirm.getByText("لا يمكنك التراجع بعد التأكيد.")).toBeVisible();
    await page.getByRole("button", { name: "إلغاء" }).click();
    await expect(page).toHaveURL(/\/quiz\//);
    await expect(confirm).toBeHidden();

    await expect(page.getByRole("button", { name: "كل الأسئلة" })).toBeVisible();
    await page.getByRole("button", { name: "كل الأسئلة" }).click();
    const jumpSheet = page.locator('[data-spekit="quiz-jump-sheet"]');
    await expect(jumpSheet).toBeVisible();
    const sheetBox = await jumpSheet.boundingBox();
    const viewport = page.viewportSize();
    if (sheetBox && viewport) {
      // Mobile jump UI is a bottom-docked sheet (content height, not a centered card).
      expect(sheetBox.y).toBeGreaterThan(viewport.height * 0.15);
      expect(viewport.height - (sheetBox.y + sheetBox.height)).toBeLessThan(48);
    }
    await page.getByRole("button", { name: "إغلاق" }).click();
    await expect(jumpSheet).toBeHidden();
  });
});
