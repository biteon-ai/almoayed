import type { LucideIcon } from "lucide-react";
import { BookOpen, LayoutDashboard, Settings, Users } from "lucide-react";

export type TeacherNavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  /** Prefix match for nested routes (e.g. /teacher/quizzes/[id]) */
  pathMatch: string;
  /** Show in mobile bottom bar */
  bottomNav?: boolean;
};

export const TEACHER_NAV_ITEMS: TeacherNavItem[] = [
  {
    href: "/teacher/dashboard",
    label: "الرئيسية",
    icon: LayoutDashboard,
    pathMatch: "/teacher/dashboard",
    bottomNav: true,
  },
  {
    href: "/teacher/students",
    label: "الطلاب",
    icon: Users,
    pathMatch: "/teacher/students",
    bottomNav: true,
  },
  {
    href: "/teacher/quizzes",
    label: "الاختبارات",
    icon: BookOpen,
    pathMatch: "/teacher/quizzes",
    bottomNav: true,
  },
  {
    href: "/teacher/settings",
    label: "الإعدادات",
    icon: Settings,
    pathMatch: "/teacher/settings",
    bottomNav: true,
  },
];

export function isTeacherNavItemActive(
  item: TeacherNavItem,
  pathname: string
): boolean {
  if (pathname === item.pathMatch) return true;
  return pathname.startsWith(`${item.pathMatch}/`);
}

/**
 * Contextual parent for the mobile header back control.
 * Returns null on teacher dashboard (home).
 */
export function teacherBackFallbackHref(pathname: string): string | null {
  if (
    !pathname ||
    pathname === "/teacher/dashboard" ||
    pathname.startsWith("/teacher/dashboard/")
  ) {
    return null;
  }
  if (pathname.startsWith("/teacher/students/") && pathname !== "/teacher/students") {
    return "/teacher/students";
  }
  if (pathname.startsWith("/teacher/quizzes/") && pathname !== "/teacher/quizzes") {
    return "/teacher/quizzes";
  }
  if (
    pathname.startsWith("/teacher/settings/") &&
    pathname !== "/teacher/settings"
  ) {
    return "/teacher/settings";
  }
  return "/teacher/dashboard";
}

/** Compact mobile header title for the current teacher route. */
export function teacherMobilePageTitle(pathname: string): string {
  if (pathname.startsWith("/teacher/students/") && pathname !== "/teacher/students") {
    return "تفاصيل الطالب";
  }
  if (pathname === "/teacher/students" || pathname.startsWith("/teacher/students/")) {
    return "الطلاب";
  }
  if (pathname === "/teacher/quizzes/new") {
    return "اختبار جديد";
  }
  if (pathname.startsWith("/teacher/quizzes/") && pathname !== "/teacher/quizzes") {
    return "تعديل الاختبار";
  }
  if (pathname === "/teacher/quizzes" || pathname.startsWith("/teacher/quizzes/")) {
    return "الاختبارات";
  }
  if (pathname.startsWith("/teacher/settings/gamification")) {
    return "التلعيب";
  }
  if (pathname === "/teacher/settings" || pathname.startsWith("/teacher/settings/")) {
    return "الإعدادات";
  }
  return "لوحة الأستاذ";
}
