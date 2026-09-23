import { expect, type Locator, type Page } from "@playwright/test";

type OpenQuizOptions = {
  /** When true, only start/retake CTAs; assert the player is not in archive review. */
  requireTaking?: boolean;
};

async function waitForQuizPlayer(page: Page): Promise<void> {
  // Prefer the player surface; loading copy is a soft gate (IndexedDB/cache
  // must not leave e2e hanging if a spinner briefly remounts).
  await expect(page.locator('[data-spekit="question-card"]')).toBeVisible({
    timeout: 45_000,
  });
  await expect(page.getByText("جاري تحميل الاختبار...")).toHaveCount(0, {
    timeout: 15_000,
  });
  await expect(page.getByText("جاري تحميل تفاصيل النتيجة...")).toHaveCount(0, {
    timeout: 15_000,
  });
}

async function clickQuizCtaAndWait(page: Page, cta: Locator) {
  await Promise.all([
    page.waitForURL(/\/quiz\//, { timeout: 20_000 }),
    cta.click(),
  ]);
  await waitForQuizPlayer(page);
}

function isTakingMode(page: Page): Promise<boolean> {
  return page
    .locator('[data-spekit="quiz-submit-button"]')
    .isVisible()
    .catch(() => false);
}

function isArchiveReview(page: Page): Promise<boolean> {
  return page
    .locator('[data-spekit="quiz-attempt-meta"]')
    .isVisible()
    .catch(() => false);
}

/**
 * Opens the first actionable student quiz CTA on `/quizzes`.
 * Labels match `getQuizListAction` in `src/lib/student-quiz-ui.ts`.
 *
 * When `requireTaking` is set, prefers never-started quizzes (`ابدأ الاختبار`)
 * and walks start/retake CTAs until the player shows the submit control —
 * shared demo students can exhaust attempts under parallel workers.
 */
export async function openFirstStudentQuiz(
  page: Page,
  options: OpenQuizOptions = {}
): Promise<void> {
  const { requireTaking = false } = options;

  const startCta = page.getByRole("link", { name: /^ابدأ الاختبار/ });
  const retakeCta = page.getByRole("link", { name: /^إعادة المحاولة/ });
  const reviewCta = page.getByRole("link", { name: /^مراجعة النتيجة/ });
  const takingCta = startCta.or(retakeCta);

  await expect(
    takingCta.or(reviewCta).first(),
    "Expected a quiz CTA on /quizzes"
  ).toBeVisible({ timeout: 15_000 });

  if (!requireTaking) {
    if (await takingCta.first().isVisible().catch(() => false)) {
      await clickQuizCtaAndWait(page, takingCta.first());
    } else {
      await clickQuizCtaAndWait(page, reviewCta.first());
    }
    return;
  }

  // Prefer fresh starts, then retakes; skip archive-only outcomes.
  const startCount = await startCta.count();
  const retakeCount = await retakeCta.count();
  const total = startCount + retakeCount;
  expect(total, "Expected a start/retake quiz CTA on /quizzes").toBeGreaterThan(
    0
  );

  for (let i = 0; i < total; i++) {
    if (i > 0) {
      await page.goto("/quizzes");
      await expect(takingCta.first()).toBeVisible({ timeout: 15_000 });
    }

    const cta =
      i < startCount ? startCta.nth(i) : retakeCta.nth(i - startCount);

    await clickQuizCtaAndWait(page, cta);

    if (await isTakingMode(page)) {
      await expect(
        page.locator('[data-spekit="quiz-submit-button"]')
      ).toBeVisible();
      await expect(page.locator('[data-spekit="quiz-attempt-meta"]')).toHaveCount(
        0
      );
      return;
    }

    // Landed in archive review (exhausted attempts) — try the next CTA.
    if (!(await isArchiveReview(page)) && i === total - 1) {
      break;
    }
  }

  throw new Error(
    "Could not open a taking-mode quiz (all start/retake CTAs opened archive review)"
  );
}
