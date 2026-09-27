import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { SPEKIT } from "@/lib/spekit-targets";

const FEATURE = "[UI-022]";

describe(`${FEATURE} teacher login shell parity`, () => {
  it("uses sticky compact indigo branding with teacher Spekit ids", () => {
    const panel = readFileSync(
      "src/components/login/TeacherLoginBrandingPanel.tsx",
      "utf8"
    );
    expect(panel).toContain("sticky top-0 z-40");
    expect(panel).toContain("from-indigo-800");
    expect(panel).toContain("SPEKIT.teacherLoginBrandHeader");
    expect(panel).toContain("SPEKIT.teacherLoginLandingBack");
    expect(panel).toContain("LoginLandingBackLink");
    expect(panel).toContain("<AppVersion");
  });

  it("mirrors student page shell structure", () => {
    const shell = readFileSync(
      "src/app/teacher/login/teacher-login-page-shell.tsx",
      "utf8"
    );
    expect(shell).toContain("TeacherLoginBrandingPanel");
    expect(shell).toContain("compact");
    expect(shell).toContain('dir="rtl"');
    expect(shell).toContain("lg:grid-cols-2");
  });

  it("form is top-aligned with install CTAs, version, and AUTH-009 hooks", () => {
    const form = readFileSync(
      "src/app/teacher/login/teacher-login-form.tsx",
      "utf8"
    );
    expect(form).toContain("items-start");
    expect(form).toContain("pt-3");
    expect(form).toContain('variant="teacher"');
    expect(form).toContain("<AppVersion");
    expect(form).toContain("APP_FOOTER_COPYRIGHT");
    expect(form).toContain("SPEKIT.teacherLoginBack");
    expect(form).toContain("SPEKIT.teacherForgotPasswordLink");
    expect(form).toContain("SPEKIT.teacherMagicLinkCta");
    expect(form).toContain('portal="teacher"');
    expect(form).not.toContain("BrandHeader");
  });

  it("server page redirects signed-in users and wraps the shell", () => {
    const page = readFileSync("src/app/teacher/login/page.tsx", "utf8");
    expect(page).toContain("getSession");
    expect(page).toContain("TeacherLoginPageShell");
    expect(page).toContain("TeacherLoginForm");
    expect(page).not.toContain("use client");
    expect(page).not.toContain("BrandHeader");
  });

  it("registers teacher Spekit shell targets", () => {
    expect(SPEKIT.teacherLoginBrandHeader).toBe("teacher-login-brand-header");
    expect(SPEKIT.teacherLoginLandingBack).toBe("teacher-login-landing-back");
  });
});
