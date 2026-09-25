import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import {
  isTeacherNavItemActive,
  teacherBackFallbackHref,
  teacherMobilePageTitle,
  TEACHER_NAV_ITEMS,
} from "@/lib/teacher-nav";
import { SPEKIT } from "@/lib/spekit-targets";

const FEATURE = "[UI-023]";

describe(`${FEATURE} teacher portal mobile chrome`, () => {
  it("defines four bottom-nav hubs matching student shell structure", () => {
    const bottom = TEACHER_NAV_ITEMS.filter((i) => i.bottomNav);
    expect(bottom.map((i) => i.href)).toEqual([
      "/teacher/dashboard",
      "/teacher/students",
      "/teacher/quizzes",
      "/teacher/settings",
    ]);
  });

  it("marks nested quiz/student/settings routes active on the parent tab", () => {
    const quizzes = TEACHER_NAV_ITEMS.find(
      (i) => i.pathMatch === "/teacher/quizzes"
    )!;
    const students = TEACHER_NAV_ITEMS.find(
      (i) => i.pathMatch === "/teacher/students"
    )!;
    const settings = TEACHER_NAV_ITEMS.find(
      (i) => i.pathMatch === "/teacher/settings"
    )!;

    expect(isTeacherNavItemActive(quizzes, "/teacher/quizzes/abc")).toBe(true);
    expect(isTeacherNavItemActive(students, "/teacher/students/xyz")).toBe(true);
    expect(
      isTeacherNavItemActive(settings, "/teacher/settings/gamification")
    ).toBe(true);
    expect(isTeacherNavItemActive(quizzes, "/teacher/dashboard")).toBe(false);
  });

  it("provides back fallbacks and mobile titles for nested pages", () => {
    expect(teacherBackFallbackHref("/teacher/dashboard")).toBeNull();
    expect(teacherBackFallbackHref("/teacher/quizzes/1")).toBe(
      "/teacher/quizzes"
    );
    expect(teacherBackFallbackHref("/teacher/students/1")).toBe(
      "/teacher/students"
    );
    expect(teacherMobilePageTitle("/teacher/quizzes")).toBe("الاختبارات");
    expect(teacherMobilePageTitle("/teacher/settings/gamification")).toBe(
      "التلعيب"
    );
  });

  it("mounts TeacherAppChrome with sticky header and bottom nav", () => {
    const layout = readFileSync(
      "src/app/teacher/(portal)/layout.tsx",
      "utf8"
    );
    expect(layout).toContain("TeacherAppChrome");
    expect(layout).not.toContain("TeacherHeaderNav");

    const chrome = readFileSync(
      "src/components/layout/TeacherAppChrome.tsx",
      "utf8"
    );
    expect(chrome).toContain("TeacherHeader");
    expect(chrome).toContain("TeacherBottomNav");
    expect(chrome).toContain("pb-28");
    expect(chrome).toContain("prefetchTeacherCoreRoutes");

    const header = readFileSync(
      "src/components/layout/TeacherHeader.tsx",
      "utf8"
    );
    expect(header).toContain("sticky top-0 z-50");
    expect(header).toContain("bg-background/90");
    expect(header).toContain("TeacherBackButton");

    const bottom = readFileSync(
      "src/components/layout/TeacherBottomNav.tsx",
      "utf8"
    );
    expect(bottom).toContain("fixed inset-x-0 bottom-0");
    expect(bottom).toContain("safe-bottom");
    expect(bottom).toContain("md:hidden");
    expect(bottom).toContain("SPEKIT.teacherLayoutNavBottom");
  });

  it("registers Spekit hooks for bottom nav and header back", () => {
    expect(SPEKIT.teacherLayoutNavBottom).toBe("teacher-layout-nav-bottom");
    expect(SPEKIT.teacherHeaderBack).toBe("teacher-header-back");
  });
});
