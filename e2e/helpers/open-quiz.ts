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

  // Prefer taking CTAs so gated-submit specs do not land in archive review.
  const takingCta = page
    .getByRole("link", { name: /^(ابدأ الاختبار|إعادة المحاولة)/ })
    .first();
  const reviewCta = page
    .getByRole("link", { name: /^مراجعة النتيجة/ })
    .first();

  await expect(
    takingCta.or(reviewCta),
    "Expected a quiz CTA on /quizzes"
  ).toBeVisible({ timeout: 15_000 });

  if (await takingCta.isVisible().catch(() => false)) {
    await Promise.all([
      page.waitForURL(/\/quiz\//, { timeout: 20_000 }),
      takingCta.click(),
    ]);
  } else if (!requireTaking) {
    await Promise.all([
      page.waitForURL(/\/quiz\//, { timeout: 20_000 }),
      reviewCta.click(),
    ]);
  } else {
    await expect(
      takingCta,
      "Expected a start/retake quiz CTA on /quizzes"
    ).toBeVisible({ timeout: 15_000 });
    await Promise.all([
      page.waitForURL(/\/quiz\//, { timeout: 20_000 }),
      takingCta.click(),
    ]);
  }

  // Wait past route loading skeleton before asserting player chrome.
  await expect(page.getByText("جاري تحميل الاختبار...")).toHaveCount(0, {
    timeout: 30_000,
  });
  await expect(page.locator('[data-spekit="question-card"]')).toBeVisible({
    timeout: 20_000,
  });

  if (requireTaking) {
    // Soft guard: if we somehow opened archive review, bounce back and retry once.
    const archive = page.getByText(/محاولة أرشيفية/);
    if (await archive.isVisible().catch(() => false)) {
      await page.goto("/quizzes");
      await expect(takingCta).toBeVisible({ timeout: 15_000 });
      await Promise.all([
        page.waitForURL(/\/quiz\//, { timeout: 20_000 }),
        takingCta.click(),
      ]);
      await expect(page.getByText("جاري تحميل الاختبار...")).toHaveCount(0, {
        timeout: 30_000,
      });
      await expect(page.locator('[data-spekit="question-card"]')).toBeVisible({
        timeout: 20_000,
      });
    }

    await expect(archive).toHaveCount(0);
    await expect(page.locator('[data-spekit="quiz-submit-button"]')).toBeVisible({
      timeout: 10_000,
    });
  }
}
