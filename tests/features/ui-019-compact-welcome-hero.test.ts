/**
 * [UI-019] Compact Welcome Hero — layout density is validated via Playwright
 * (`e2e/ui-019-compact-welcome-hero.spec.ts`). No pure subtitle/copy helper was
 * extracted from `StudentDashboardHero`; this file documents e2e-only coverage.
 */
import { describe, expect, it } from "vitest";

describe("[UI-019] Compact welcome hero", () => {
  it("documents e2e-only coverage (no extracted pure helper)", () => {
    expect(true).toBe(true);
  });
});
