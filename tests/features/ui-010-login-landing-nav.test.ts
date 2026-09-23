import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const FEATURE = "[UI-010]";

describe(`${FEATURE} login landing navigation (browser vs PWA)`, () => {
  it("detects standalone via display-mode / iOS navigator.standalone helpers", () => {
    const installLib = readFileSync("src/lib/pwa-install.ts", "utf8");
    expect(installLib).toContain("display-mode: standalone");
    expect(installLib).toContain("navigator");
    expect(installLib).toContain("standalone");
  });

  it("gates landing back + brand home link on ready && !installed", () => {
    const nav = readFileSync(
      "src/components/login/LoginLandingNav.tsx",
      "utf8"
    );
    expect(nav).toContain("usePwaInstall");
    expect(nav).toContain("ready && !installed");
    expect(nav).toContain('href="/"');
    expect(nav).toContain("العودة للصفحة الرئيسية");
    expect(nav).toContain("loginLandingBack");
    expect(nav).toContain("<Home");
    expect(nav).not.toContain("ChevronRight");
    expect(nav).not.toContain("الرئيسية</span>");
    expect(nav).toContain("h-9 w-9");
    expect(nav).toContain("rounded-full");
    expect(nav).toContain("items-center justify-center");
  });

  it("places the landing back chip in the brand header, not the form", () => {
    const form = readFileSync("src/app/login/login-form.tsx", "utf8");
    const panel = readFileSync(
      "src/components/login/LoginBrandingPanel.tsx",
      "utf8"
    );
    expect(form).not.toContain("LoginLandingBackLink");
    expect(panel).toContain("LoginLandingBackLink");
    expect(panel).toContain("LoginBrandHomeLink");
    expect(panel).toContain("flex items-center justify-between gap-3");
  });

  it("returns null unless the client is a non-standalone browser", () => {
    const nav = readFileSync(
      "src/components/login/LoginLandingNav.tsx",
      "utf8"
    );
    expect(nav).toContain("const showInBrowser = ready && !installed");
    expect(nav).toContain("if (!showInBrowser) return null");
  });
});
