import { expect, test } from "@playwright/test";
import { loginAsDemoStudent, shouldSkipLiveSupabase } from "./helpers/demo-login";

const FEATURE = "[UI-007]";

test.describe(`${FEATURE} Results score ring badge`, () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test("circular ring badge is fixed-size with percent + SVG arc", async ({
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

    await page.goto("/results");
    await expect(page.locator('[data-spekit="student-results-page"]')).toBeVisible({
      timeout: 15_000,
    });

    const badge = page.locator('[data-spekit="results-score-badge"]').first();
    if ((await badge.count()) === 0) {
      test.skip(true, "No result cards for the demo student");
    }

    await expect(badge).toBeVisible();
    const box = await badge.boundingBox();
    expect(box?.width).toBeGreaterThanOrEqual(46);
    expect(box?.width).toBeLessThanOrEqual(58);
    expect(box?.height).toBeGreaterThanOrEqual(46);
    expect(box?.height).toBeLessThanOrEqual(58);
    await expect(badge.locator("svg circle")).toHaveCount(2);
    await expect(badge).toContainText("%");
  });
});
