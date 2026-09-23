import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { parseAppearance, resolveScheme } from "@/lib/appearance";

const FEATURE = "[UI-012]";

describe(`${FEATURE} appearance helpers`, () => {
  it("parseAppearance maps unknown values to system", () => {
    expect(parseAppearance(null)).toBe("system");
    expect(parseAppearance("")).toBe("system");
    expect(parseAppearance("sepia")).toBe("system");
    expect(parseAppearance("dark")).toBe("dark");
    expect(parseAppearance("light")).toBe("light");
    expect(parseAppearance("system")).toBe("system");
  });

  it("resolveScheme follows explicit light/dark and system + prefersDark", () => {
    expect(resolveScheme("light", true)).toBe("light");
    expect(resolveScheme("dark", false)).toBe("dark");
    expect(resolveScheme("system", true)).toBe("dark");
    expect(resolveScheme("system", false)).toBe("light");
  });
});

describe(`${FEATURE} PWA entry routing`, () => {
  it("manifest starts at /login within scope /", () => {
    const manifest = JSON.parse(
      readFileSync("public/manifest.json", "utf8")
    ) as { start_url: string; scope: string; display: string };
    expect(manifest.start_url).toBe("/login");
    expect(manifest.scope).toBe("/");
    expect(manifest.display).toBe("standalone");
  });

  it("landing mounts standalone → /login client redirect", () => {
    const landing = readFileSync(
      "src/components/landing/LandingPageView.tsx",
      "utf8"
    );
    const guard = readFileSync(
      "src/components/pwa/PwaStandaloneEntryRedirect.tsx",
      "utf8"
    );
    expect(landing).toContain("PwaStandaloneEntryRedirect");
    expect(guard).toContain("isPwaStandalone");
    expect(guard).toContain('router.replace("/login")');
  });

  it("login page sends signed-in users to their dashboard", () => {
    const login = readFileSync("src/app/login/page.tsx", "utf8");
    expect(login).toContain("getSession");
    expect(login).toContain('session.role === "TEACHER"');
    expect(login).toContain("/teacher/dashboard");
    expect(login).toContain("/dashboard");
  });
});
