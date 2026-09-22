import { describe, expect, it } from "vitest";
import {
  studentBackFallbackHref,
  studentMobilePageTitle,
} from "@/lib/student-nav";

const FEATURE = "[UI-001]";

describe(`${FEATURE} studentBackFallbackHref`, () => {
  it("hides back on dashboard home", () => {
    expect(studentBackFallbackHref("/dashboard")).toBeNull();
    expect(studentBackFallbackHref("/dashboard/")).toBeNull();
  });

  it("hides back during a live quiz attempt (player has its own exit)", () => {
    expect(studentBackFallbackHref("/quiz/abc")).toBeNull();
  });

  it("returns /dashboard for top-level student sections", () => {
    expect(studentBackFallbackHref("/quizzes")).toBe("/dashboard");
    expect(studentBackFallbackHref("/results")).toBe("/dashboard");
    expect(studentBackFallbackHref("/settings")).toBe("/dashboard");
  });

  it("returns /results for a result detail page", () => {
    expect(studentBackFallbackHref("/results/sub-1")).toBe("/results");
  });
});

describe(`${FEATURE} studentMobilePageTitle`, () => {
  it("maps routes to compact Arabic titles", () => {
    expect(studentMobilePageTitle("/dashboard")).toBe("المؤيد");
    expect(studentMobilePageTitle("/quizzes")).toBe("الاختبارات");
    expect(studentMobilePageTitle("/results")).toBe("نتائجي");
    expect(studentMobilePageTitle("/results/sub-1")).toBe("تفاصيل النتيجة");
    expect(studentMobilePageTitle("/settings")).toBe("الإعدادات");
    expect(studentMobilePageTitle("/quiz/abc")).toBe("الاختبار");
  });
});
