import { describe, expect, it } from "vitest";
import { shouldShowA2hsSheet } from "@/lib/a2hs-prompt";

const FEATURE = "[UI-015]";

const base = {
  standalone: false,
  isStudent: true,
  pathname: "/dashboard",
  isPhoneViewport: true,
  sessionHidden: false,
  dismissedAt: null as string | null,
  now: Date.parse("2026-09-20T12:00:00.000Z"),
};

describe(`${FEATURE} A2HS eligibility`, () => {
  it("shows for a signed-in student on phone browser home", () => {
    expect(shouldShowA2hsSheet(base)).toBe(true);
  });

  it("hides when already standalone", () => {
    expect(shouldShowA2hsSheet({ ...base, standalone: true })).toBe(false);
  });

  it("hides on quiz routes", () => {
    expect(shouldShowA2hsSheet({ ...base, pathname: "/quiz/abc" })).toBe(false);
    expect(shouldShowA2hsSheet({ ...base, pathname: "/quiz" })).toBe(false);
  });

  it("hides when sessionHidden or within 24h snooze", () => {
    expect(shouldShowA2hsSheet({ ...base, sessionHidden: true })).toBe(false);
    expect(
      shouldShowA2hsSheet({
        ...base,
        dismissedAt: "2026-09-20T10:00:00.000Z",
      })
    ).toBe(false);
    expect(
      shouldShowA2hsSheet({
        ...base,
        dismissedAt: "2026-09-18T10:00:00.000Z",
      })
    ).toBe(true);
  });

  it("hides on desktop viewport and non-students", () => {
    expect(shouldShowA2hsSheet({ ...base, isPhoneViewport: false })).toBe(false);
    expect(shouldShowA2hsSheet({ ...base, isStudent: false })).toBe(false);
  });
});
