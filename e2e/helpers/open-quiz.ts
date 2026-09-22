import { expect, type Page } from "@playwright/test";

type OpenQuizOptions = {
  /** When true, only start/retake CTAs; assert the player is not in archive review. */
  requireTaking?: boolean;
};

/**
 * Opens the first actionable student quiz CTA on `/quizzes`.
 * Labels match `getQuizListAction` in `src/lib/student-quiz-ui.ts`.
 */
export async function openFirstStudentQuiz(
  page: Page,
  options: OpenQuizOptions = {}
): Promise<void> {
  const { requireTaking = false } = options;

  // Prefer taking links (no ?review=) so gated-submit specs do not land in archive review.
  const takingCta = page
    .locator('a[href^="/quiz/"]:not([href*="review="])')
    .filter({ hasText: /^(ابدأ الاختبار|إعادة المحاولة)/ })
    .first();
  const reviewCta = page
    .getByRole("link", { name: /^مراجعة النتيجة/ })
    .first();

  if (await takingCta.isVisible().catch(() => false)) {
    await takingCta.click();
  } else if (!requireTaking && (await reviewCta.isVisible().catch(() => false))) {
    await reviewCta.click();
  } else {
    await expect(
      takingCta,
      "Expected a start/retake quiz CTA on /quizzes"
    ).toBeVisible({ timeout: 15_000 });
    await takingCta.click();
  }

  await expect(page).toHaveURL(/\/quiz\//, { timeout: 15_000 });
  await expect(page.locator('[data-spekit="question-card"]')).toBeVisible({
    timeout: 15_000,
  });

  if (requireTaking) {
    // Soft guard: if we somehow opened archive review, bounce back and retry once.
    const archive = page.getByText(/محاولة أرشيفية/);
    if (await archive.isVisible().catch(() => false)) {
      await page.goto("/quizzes");
      await expect(takingCta).toBeVisible({ timeout: 15_000 });
      await takingCta.click();
      await expect(page).toHaveURL(/\/quiz\//, { timeout: 15_000 });
      await expect(page.locator('[data-spekit="question-card"]')).toBeVisible({
        timeout: 15_000,
      });
    }

    await expect(archive).toHaveCount(0);
    await expect(page.locator('[data-spekit="quiz-submit-button"]')).toBeVisible({
      timeout: 10_000,
    });
  }
}
