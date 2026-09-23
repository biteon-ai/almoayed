import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const FEATURE = "[UI-010]";

describe(`${FEATURE} login mobile sticky header density`, () => {
  it("keeps the compact brand header sticky on mobile with tight padding", () => {
    const panel = readFileSync(
      "src/components/login/LoginBrandingPanel.tsx",
      "utf8"
    );
    expect(panel).toContain("sticky top-0 z-40");
    expect(panel).toContain("lg:hidden");
    expect(panel).toContain("py-3");
    expect(panel).toContain("loginBrandHeader");
  });

  it("top-aligns the login form under the sticky header on small screens", () => {
    const form = readFileSync("src/app/login/login-form.tsx", "utf8");
    expect(form).toContain("items-start");
    expect(form).toContain("pt-3");
    expect(form).toContain("lg:items-center");
  });
});
