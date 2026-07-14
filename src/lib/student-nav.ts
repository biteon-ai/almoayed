import type { LucideIcon } from "lucide-react";
import {
  BarChart3,
  BookOpen,
  Home,
  Settings,
} from "lucide-react";

export type StudentNavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  /** Match pathname only (ignore hash) */
  pathMatch?: string;
  /** Hash segment on /dashboard e.g. "quizzes" | "scores" */
  hash?: string;
  /** Show in mobile bottom bar */
  bottomNav?: boolean;
};

export const STUDENT_NAV_ITEMS: StudentNavItem[] = [
  {
    href: "/dashboard",
    label: "الرئيسية",
    icon: Home,
    pathMatch: "/dashboard",
    bottomNav: true,
  },
  {
    href: "/dashboard#quizzes",
    label: "الاختبارات",
    icon: BookOpen,
    pathMatch: "/dashboard",
    hash: "quizzes",
    bottomNav: true,
  },
  {
    href: "/dashboard#scores",
    label: "نتائجي",
    icon: BarChart3,
    pathMatch: "/dashboard",
    hash: "scores",
    bottomNav: true,
  },
  {
    href: "/settings",
    label: "الإعدادات",
    icon: Settings,
    pathMatch: "/settings",
    bottomNav: true,
  },
];

export function isStudentNavItemActive(
  item: StudentNavItem,
  pathname: string,
  hash: string
): boolean {
  const normalizedHash = hash.replace(/^#/, "");

  if (item.pathMatch === "/settings") {
    return pathname === "/settings" || pathname.startsWith("/settings/");
  }

  if (pathname.startsWith("/quiz/")) {
    return item.hash === "quizzes";
  }

  if (item.pathMatch === "/dashboard") {
    if (pathname !== "/dashboard") {
      return false;
    }
    if (item.hash) {
      return normalizedHash === item.hash;
    }
    return !normalizedHash || normalizedHash === "welcome";
  }

  return pathname === item.href;
}
