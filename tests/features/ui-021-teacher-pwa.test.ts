import { existsSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  APP_THEME_COLOR,
  TEACHER_APP_THEME_COLOR,
} from "@/lib/constants";
import {
  getPwaPortal,
  PWA_PORTAL_STORAGE_KEY,
  setPwaPortal,
  standaloneEntryPath,
} from "@/lib/pwa-portal";
import { SPEKIT } from "@/lib/spekit-targets";

const FEATURE = "[UI-021]";

describe(`${FEATURE} teacher portal PWA`, () => {
  it("defaults portal hint to student and persists teacher", () => {
    const store = new Map<string, string>();
    const original = globalThis.localStorage;
    Object.defineProperty(globalThis, "localStorage", {
      configurable: true,
      value: {
        getItem: (k: string) => store.get(k) ?? null,
        setItem: (k: string, v: string) => {
          store.set(k, v);
        },
        removeItem: (k: string) => {
          store.delete(k);
        },
      },
    });

    expect(getPwaPortal()).toBe("student");
    setPwaPortal("teacher");
    expect(store.get(PWA_PORTAL_STORAGE_KEY)).toBe("teacher");
    expect(getPwaPortal()).toBe("teacher");
    setPwaPortal("student");
    expect(getPwaPortal()).toBe("student");

    Object.defineProperty(globalThis, "localStorage", {
      configurable: true,
      value: original,
    });
  });

  it("maps portal hint to standalone entry paths", () => {
    expect(standaloneEntryPath("teacher")).toBe("/teacher/login");
    expect(standaloneEntryPath("student")).toBe("/login");
  });

  it("ships a distinct teacher manifest and icons", () => {
    const teacher = JSON.parse(
      readFileSync("public/teacher-manifest.json", "utf8")
    ) as {
      id: string;
      start_url: string;
      theme_color: string;
      icons: { src: string }[];
    };
    const student = JSON.parse(
      readFileSync("public/manifest.json", "utf8")
    ) as {
      start_url: string;
      theme_color: string;
      icons: { src: string }[];
    };

    expect(teacher.id).toBe("/teacher");
    expect(teacher.start_url).toBe("/teacher/login");
    expect(teacher.theme_color).toBe(TEACHER_APP_THEME_COLOR);
    expect(teacher.theme_color).not.toBe(APP_THEME_COLOR);
    expect(student.start_url).toBe("/login");
    expect(student.theme_color).toBe(APP_THEME_COLOR);

    for (const icon of teacher.icons) {
      expect(icon.src.startsWith("/teacher-icon")).toBe(true);
    }
    for (const icon of student.icons) {
      expect(icon.src.startsWith("/icon-")).toBe(true);
    }

    expect(existsSync("public/teacher-icon-192.png")).toBe(true);
    expect(existsSync("public/teacher-icon-512.png")).toBe(true);
    expect(existsSync("public/teacher-apple-touch-icon.png")).toBe(true);
  });

  it("links teacher manifest from teacher login layout and precaches in SW", () => {
    const layout = readFileSync("src/app/teacher/login/layout.tsx", "utf8");
    expect(layout).toContain('manifest: "/teacher-manifest.json"');
    expect(layout).toContain("TEACHER_APP_THEME_COLOR");
    expect(layout).toContain("/teacher-apple-touch-icon.png");

    const root = readFileSync("src/app/layout.tsx", "utf8");
    expect(root).toContain('manifest: "/manifest.json"');

    const sw = readFileSync("public/sw.js", "utf8");
    expect(sw).toContain("/teacher-manifest.json");
    expect(sw).toContain("/teacher-icon-192.png");
    expect(sw).toContain("APP_SHELL_CACHE_v4");
  });

  it("exposes teacher Spekit install hooks and portal-aware redirect", () => {
    expect(SPEKIT.teacherPwaInstallButtons).toBe("teacher-pwa-install-buttons");
    expect(SPEKIT.teacherLoginLandingBack).toBe("teacher-login-landing-back");

    const redirect = readFileSync(
      "src/components/pwa/PwaStandaloneEntryRedirect.tsx",
      "utf8"
    );
    expect(redirect).toContain("standaloneEntryPath");

    const prompt = readFileSync(
      "src/components/pwa/PwaInstallPrompt.tsx",
      "utf8"
    );
    expect(prompt).toContain('variant = "student"');
    expect(prompt).toContain("teacherPwaInstallButtons");
  });
});
