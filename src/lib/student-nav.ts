"use client";

import type { LucideIcon } from "lucide-react";
import {
  BarChart3,
  BookOpen,
  Home,
  Settings,
} from "lucide-react";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

export type StudentNavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  /** Match pathname only (ignore hash) */
  pathMatch?: string;
  /** Hash segment on /dashboard e.g. "quizzes" | "scores" */
  hash?: DashboardHash;
  /** Show in mobile bottom bar */
  bottomNav?: boolean;
};

export type DashboardHash = "quizzes" | "scores" | "weak" | "teachers" | "welcome";

export type DashboardTabValue = "scores" | "weak" | "teachers";

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

export function parseDashboardHash(raw: string): DashboardHash | null {
  const hash = raw.replace(/^#/, "");
  if (hash === "quizzes" || hash === "scores" || hash === "weak" || hash === "teachers") {
    return hash;
  }
  if (hash === "welcome") {
    return "welcome";
  }
  return null;
}

export function dashboardHashToTab(hash: DashboardHash): DashboardTabValue | null {
  if (hash === "scores" || hash === "weak" || hash === "teachers") {
    return hash;
  }
  return null;
}

export function scrollToStudentNavTarget(target: DashboardHash | "home") {
  if (typeof window === "undefined") {
    return;
  }

  if (target === "home") {
    window.scrollTo({ top: 0, behavior: "smooth" });
    return;
  }

  window.requestAnimationFrame(() => {
    let element: HTMLElement | null = null;

    if (target === "welcome") {
      element = document.getElementById("student-welcome");
    } else if (target === "quizzes") {
      element = document.getElementById("quizzes");
    } else {
      element = document.getElementById("dashboard-tabs");
    }

    element?.scrollIntoView({ behavior: "smooth", block: "start" });
  });
}

function dispatchHashChange() {
  window.dispatchEvent(new HashChangeEvent("hashchange"));
}

export function setDashboardLocationHash(
  hash: DashboardHash | "home",
  replace = false
) {
  const nextHash =
    hash === "home" ? "" : hash === "welcome" ? "#welcome" : `#${hash}`;
  const nextUrl = `/dashboard${nextHash}`;
  const currentUrl = `${window.location.pathname}${window.location.hash}`;

  if (currentUrl === nextUrl) {
    dispatchHashChange();
    return;
  }

  const method = replace ? "replaceState" : "pushState";
  window.history[method](null, "", nextUrl);
  dispatchHashChange();
}

export function navigateStudentNavItem(
  item: StudentNavItem,
  opts: { pathname: string; push: (url: string) => void }
) {
  if (item.pathMatch === "/settings") {
    opts.push("/settings");
    return;
  }

  if (item.pathMatch !== "/dashboard") {
    opts.push(item.href);
    return;
  }

  if (opts.pathname !== "/dashboard") {
    opts.push(item.href);
    return;
  }

  const target: DashboardHash | "home" = item.hash ?? "home";
  setDashboardLocationHash(target);
  scrollToStudentNavTarget(target);
}

export function applyDashboardHashFromLocation(
  setTab?: (tab: DashboardTabValue) => void,
  options?: { isInitialMount?: boolean }
) {
  if (typeof window === "undefined") {
    return;
  }

  const raw = window.location.hash.replace(/^#/, "");

  if (!raw) {
    if (!options?.isInitialMount) {
      scrollToStudentNavTarget("home");
    }
    return;
  }

  const parsed = parseDashboardHash(raw);
  if (!parsed) {
    return;
  }

  if (parsed === "quizzes") {
    scrollToStudentNavTarget("quizzes");
    return;
  }

  if (parsed === "welcome") {
    scrollToStudentNavTarget("welcome");
    return;
  }

  const tab = dashboardHashToTab(parsed);
  if (tab) {
    setTab?.(tab);
    scrollToStudentNavTarget(parsed);
  }
}

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

export function useStudentRouteHash() {
  const pathname = usePathname();
  const [hash, setHash] = useState("");

  useEffect(() => {
    const read = () => setHash(window.location.hash);
    read();
    window.addEventListener("hashchange", read);
    window.addEventListener("popstate", read);
    return () => {
      window.removeEventListener("hashchange", read);
      window.removeEventListener("popstate", read);
    };
  }, [pathname]);

  return hash;
}
