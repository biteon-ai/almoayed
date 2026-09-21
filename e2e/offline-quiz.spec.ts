import { test, expect } from "@playwright/test";

test.describe("OFFLINE-001 offline quiz PWA", () => {
  test("offline fallback page is Arabic RTL", async ({ page }) => {
    await page.goto("/offline.html");
    await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
    await expect(page.locator("html")).toHaveAttribute("lang", "ar");
    await expect(page.getByRole("heading")).toContainText("ما في اتصال");
    await expect(page.getByRole("button", { name: "إعادة المحاولة" })).toBeVisible();
  });

  test("service worker script is served", async ({ request }) => {
    const response = await request.get("/sw.js");
    expect(response.ok()).toBeTruthy();
    const body = await response.text();
    expect(body).toContain("APP_SHELL_CACHE_v3");
    expect(body).toContain("offline.html");
  });
});
