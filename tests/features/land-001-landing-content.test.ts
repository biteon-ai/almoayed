import { describe, expect, it } from "vitest";
import {
  LANDING_AUDIENCE,
  LANDING_FEATURES,
  LANDING_FOOTER,
  LANDING_HERO,
  LANDING_NAV_LINKS,
  LANDING_TRUST_METRICS,
} from "@/lib/landing-content";

describe("LAND-001 landing-content", () => {
  it("exports hero with primary and secondary CTAs", () => {
    expect(LANDING_HERO.title).toContain("اختبر مهاراتك");
    expect(LANDING_HERO.primaryCta.href).toBe("/login");
    expect(LANDING_HERO.secondaryCta.href).toBe("/login?from=/quizzes");
  });

  it("exports four trust metrics", () => {
    expect(LANDING_TRUST_METRICS).toHaveLength(4);
    expect(LANDING_TRUST_METRICS.map((m) => m.id)).toEqual([
      "students",
      "tests",
      "satisfaction",
      "grading",
    ]);
  });

  it("exports three feature cards", () => {
    expect(LANDING_FEATURES).toHaveLength(3);
  });

  it("exports student and teacher audience cards", () => {
    expect(LANDING_AUDIENCE).toHaveLength(2);
    expect(LANDING_AUDIENCE.map((c) => c.role)).toEqual(["student", "teacher"]);
  });

  it("exports nav links and footer links", () => {
    expect(LANDING_NAV_LINKS.length).toBeGreaterThanOrEqual(3);
    expect(LANDING_FOOTER.links.length).toBeGreaterThanOrEqual(2);
  });
});
