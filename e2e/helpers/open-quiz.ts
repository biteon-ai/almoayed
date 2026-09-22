import { expect, type Page } from "@playwright/test";

/**
 * Opens the first actionable student quiz CTA on `/quizzes`.
 * Labels match `getQuizListAction` in `src/lib/student-quiz-ui.ts`.
 */
export async function openFirstStudentQuiz(page: Page): Promise<void> {
  const startQuiz = page.getByRole("link", { name: /^ابدأ الاختبار/ }).first();
  const retakeQuiz = page
    .getByRole("link", { name: /^إعادة المحاولة/ })
    .first();
  const reviewQuiz = page
    .getByRole("link", { name: /^مراجعة النتيجة/ })
    .first();

  // Prefer a fresh start when available; otherwise retake / review.
  if (await startQuiz.isVisible().catch(() => false)) {
    await startQuiz.click();
  } else if (await retakeQuiz.isVisible().catch(() => false)) {
    await retakeQuiz.click();
  } else {
    await expect(reviewQuiz).toBeVisible({ timeout: 15_000 });
    await reviewQuiz.click();
  }

  await expect(page).toHaveURL(/\/quiz\//, { timeout: 15_000 });
}
