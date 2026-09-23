import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import packageJson from "../../package.json";
import { APP_VERSION } from "@/lib/constants";

const FEATURE = "[UI-020]";

describe(`${FEATURE} app version indicator`, () => {
  it("reads the published version from package.json", () => {
    expect(APP_VERSION).toBe(packageJson.version);
    expect(APP_VERSION).toMatch(/^\d+\.\d+\.\d+/);
  });

  it("auto-syncs package.json from GitHub release tags", () => {
    const workflow = readFileSync(
      ".github/workflows/sync-version-on-release.yml",
      "utf8"
    );
    expect(workflow).toContain("release:");
    expect(workflow).toContain("types: [published]");
    expect(workflow).toContain("package.json");
    expect(workflow).toContain("git push");
  });

  it("shows v{version} in Settings حول التطبيق and on the login footer", () => {
    const version = readFileSync("src/components/brand/AppVersion.tsx", "utf8");
    expect(version).toContain("`v${APP_VERSION}`");
    expect(version).toContain("SPEKIT.appVersion");
    expect(version).toContain("text-xs text-slate-400");

    const settings = readFileSync(
      "src/components/settings/SettingsPage.tsx",
      "utf8"
    );
    expect(settings).toContain("<AppVersion");
    expect(settings).toContain('id="about"');
    expect(settings).toContain("حول التطبيق");

    const loginForm = readFileSync("src/app/login/login-form.tsx", "utf8");
    expect(loginForm).toContain("<AppVersion");
    expect(loginForm).toContain("APP_FOOTER_COPYRIGHT");

    const branding = readFileSync(
      "src/components/login/LoginBrandingPanel.tsx",
      "utf8"
    );
    expect(branding).toContain("<AppVersion");
    expect(branding).toContain("APP_FOOTER_COPYRIGHT");

    for (const file of [
      "src/app/teacher/login/page.tsx",
      "src/components/layout/StudentAppChrome.tsx",
      "src/app/teacher/(portal)/layout.tsx",
      "src/app/admin/(portal)/layout.tsx",
      "src/app/(student-flows)/layout.tsx",
      "src/app/page.tsx",
    ]) {
      const src = readFileSync(file, "utf8");
      expect(src, file).not.toContain("AppVersion");
      expect(src, file).not.toContain("APP_VERSION");
    }

    const drawer = readFileSync(
      "src/components/student/StudentProfileDrawer.tsx",
      "utf8"
    );
    expect(drawer).not.toContain("APP_VERSION");
    expect(drawer).toContain("/settings#about");
  });
});
