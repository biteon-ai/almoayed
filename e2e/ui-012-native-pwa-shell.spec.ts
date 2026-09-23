import { expect, test } from "@playwright/test";
import { loginAsDemoStudent, shouldSkipLiveSupabase } from "./helpers/demo-login";

const FEATURE = "[UI-012]";

test.describe(`${FEATURE} PWA shell meta`, () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test("login links standalone manifest and locks scale", async ({ page }) => {
    await page.goto("/login");
    await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
    await expect(page.locator('link[rel="manifest"]')).toHaveAttribute(
      "href",
      "/manifest.json"
    );

    const viewport = await page.locator('meta[name="viewport"]').getAttribute("content");
    expect(viewport ?? "").toMatch(/maximum-scale=1/);
    expect(viewport ?? "").toMatch(/user-scalable=no|user-scalable=0/i);

    const manifest = await page.evaluate(async () => {
      const res = await fetch("/manifest.json");
      return res.json() as Promise<{
        display: string;
        name: string;
        start_url: string;
        scope: string;
      }>;
    });
    expect(manifest.display).toBe("standalone");
    expect(manifest.name).toBe("المؤيد");
    expect(manifest.start_url).toBe("/login");
    expect(manifest.scope).toBe("/");
  });
});

test.describe(`${FEATURE} Student native chrome`, () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test("tiles, mobile back, and sticky quiz chrome after demo login", async ({
    page,
  }) => {
    test.skip(
      shouldSkipLiveSupabase(),
      "Skipped without live Supabase (set E2E_SKIP_AUTHED=false + real NEXT_PUBLIC_SUPABASE_URL to enable)"
    );

    await loginAsDemoStudent(page);

    await expect(page.locator('[data-spekit="dashboard-action-tiles"]')).toBeVisible({
      timeout: 15_000,
    });
    await expect(page.locator('[data-spekit="dashboard-tile-quizzes"]')).toBeVisible();

    const dismiss = page.locator('[data-spekit="pwa-install-sheet-dismiss"]');
    if (await dismiss.isVisible()) {
      await dismiss.click();
    }

    // Home: no back control; section pages show contextual back
    await expect(page.locator('[data-spekit="student-header-back"]')).toHaveCount(0);
    await page.goto("/quizzes");
    await expect(page.locator('[data-spekit="student-header-back"]')).toBeVisible();
    await page.getByRole("button", { name: "رجوع" }).click();
    await expect(page).toHaveURL(/\/dashboard/);

    await page.addInitScript(() => {
      Object.defineProperty(window, "matchMedia", {
        writable: true,
        value: (query: string) => ({
          matches: query.includes("display-mode: standalone"),
          media: query,
          addEventListener: () => undefined,
          removeEventListener: () => undefined,
          addListener: () => undefined,
          removeListener: () => undefined,
          dispatchEvent: () => false,
          onchange: null,
        }),
      });
    });
    await page.reload();
    await expect(page.locator('[data-spekit="pwa-install-sheet"]')).toBeHidden();
  });
});

test.describe(`${FEATURE} Desktop profile drawer`, () => {
  test.use({ viewport: { width: 1280, height: 800 } });

  test("header gear opens native profile drawer", async ({ page }) => {
    test.skip(
      shouldSkipLiveSupabase(),
      "Skipped without live Supabase (set E2E_SKIP_AUTHED=false + real NEXT_PUBLIC_SUPABASE_URL to enable)"
    );

    await loginAsDemoStudent(page);

    await page.getByRole("button", { name: "الحساب" }).click();
    await expect(page.locator('[data-spekit="native-profile-drawer"]')).toBeVisible();
    await page.locator('[data-spekit="native-drawer-close"]').click();
    await expect(page.locator('[data-spekit="native-profile-drawer"]')).toHaveCount(0);
  });
});
