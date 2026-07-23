import { test, expect } from "@playwright/test";

test.describe("[ADMIN-001] Super Admin smoke", () => {
  test("admin login page renders Arabic form", async ({ page }) => {
    await page.goto("/admin/login");
    await expect(page.getByRole("heading", { name: /Super Admin/i })).toBeVisible();
    await expect(page.getByLabel("البريد الإلكتروني")).toBeVisible();
  });

  test("emergency fallback page still available", async ({ page }) => {
    await page.goto("/admin/emergency");
    await expect(page.getByRole("heading", { name: /دخول إداري للطوارئ/i })).toBeVisible();
  });

  test("teacher email login page renders", async ({ page }) => {
    await page.goto("/teacher/login");
    await expect(page.getByRole("heading", { name: /دخول المدرس/i })).toBeVisible();
  });
});
