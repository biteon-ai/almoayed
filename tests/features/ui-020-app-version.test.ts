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

  it("shows v{version} only in Settings حول التطبيق — not on shells, login, or landing", () => {
    const version = readFileSync("src/components/brand/AppVersion.tsx", "utf8");
    expect(version).toContain("`v${APP_VERSION}`");
    expect(version).toContain("SPEKIT.appVersion");

    const settings = readFileSync(
      "src/components/settings/SettingsPage.tsx",
      "utf8"
    );
    expect(settings).toContain("<AppVersion");
    expect(settings).toContain('id="about"');
    expect(settings).toContain("حول التطبيق");

    for (const file of [
      "src/app/login/login-form.tsx",
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
