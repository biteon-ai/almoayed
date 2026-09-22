import { expect, test } from "@playwright/test";
import { loginAsDemoStudent, shouldSkipLiveSupabase } from "./helpers/demo-login";

const FEATURE = "[UI-019]";

/** Soft ceiling for ultra-compact phone hero (py-3 density). */
const MAX_HERO_HEIGHT_PX = 200;

test.describe(`${FEATURE} Compact welcome hero`, () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test("phone hero is compact: no multi-line subtitle, streak/goal visible", async ({
    page,
  }) => {
    test.skip(
      shouldSkipLiveSupabase(),
      "Skipped without live Supabase (set E2E_SKIP_AUTHED=false + real NEXT_PUBLIC_SUPABASE_URL to enable)"
    );

    await loginAsDemoStudent(page);

    const hero = page.locator('[data-spekit="student-welcome"]');
    await expect(hero).toBeVisible({ timeout: 15_000 });
    await expect(page.locator("#student-welcome")).toBeVisible();

    await expect(hero.getByRole("heading", { level: 1 })).toBeVisible();
    // Long names must wrap, not ellipsis-clip.
    await expect(hero.getByRole("heading", { level: 1 })).not.toHaveClass(
      /truncate/
    );
    await expect(hero.getByText("هدف اليوم")).toBeVisible();
    await expect(hero.getByText("أيام")).toBeVisible();

    await expect(
      hero.getByText("استمر في إنجاز الاختبارات اليومية")
    ).toHaveCount(0);

    const box = await hero.boundingBox();
    expect(box).toBeTruthy();
    expect(box!.height).toBeLessThanOrEqual(MAX_HERO_HEIGHT_PX);

    const tiles = page.locator('[data-spekit="dashboard-action-tiles"]');
    await expect(tiles).toBeVisible();
    const tileBox = await tiles.boundingBox();
    expect(tileBox).toBeTruthy();
    // At least part of the action tiles should sit within the first viewport.
    expect(tileBox!.y).toBeLessThan(844);
  });
});
