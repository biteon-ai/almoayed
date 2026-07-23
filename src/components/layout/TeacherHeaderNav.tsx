"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BookOpen,
  LayoutDashboard,
  Settings,
  Users,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { SPEKIT } from "@/lib/spekit-targets";

const NAV_ITEMS: {
  label: string;
  href: string;
  icon: LucideIcon;
}[] = [
  { label: "الرئيسية", href: "/teacher/dashboard", icon: LayoutDashboard },
  { label: "الطلاب", href: "/teacher/students", icon: Users },
  { label: "الاختبارات", href: "/teacher/quizzes", icon: BookOpen },
  { label: "الإعدادات", href: "/teacher/settings", icon: Settings },
];

function isTeacherNavActive(pathname: string, href: string): boolean {
  if (pathname === href) return true;
  // Nested routes (e.g. /teacher/quizzes/[id]) keep the parent item active
  return pathname.startsWith(`${href}/`);
}

function navLinkClass(active: boolean, compact?: boolean) {
  return cn(
    "inline-flex items-center gap-1.5 rounded-xl font-semibold transition-colors select-none",
    compact ? "h-9 shrink-0 px-3 text-xs" : "h-9 px-3 text-sm",
    active
      ? "bg-brand-50 text-brand-800 shadow-sm ring-1 ring-brand-200/80 dark:bg-brand-950/40 dark:text-brand-200 dark:ring-brand-800/50"
      : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
  );
}

export function TeacherHeaderNav({
  variant = "desktop",
}: {
  variant?: "desktop" | "mobile";
}) {
  const pathname = usePathname() ?? "";
  const compact = variant === "mobile";

  return (
    <nav
      aria-label="تنقل لوحة الأستاذ"
      className={
        compact
          ? "flex gap-1 overflow-x-auto border-t px-4 py-2 md:hidden"
          : "hidden items-center gap-1 md:flex"
      }
      data-spekit={
        compact ? SPEKIT.teacherLayoutNavMobile : SPEKIT.teacherLayoutNav
      }
    >
      {NAV_ITEMS.map((item) => {
        const active = isTeacherNavActive(pathname, item.href);
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={navLinkClass(active, compact)}
          >
            <Icon className={cn("shrink-0", compact ? "size-3.5" : "size-4")} />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
