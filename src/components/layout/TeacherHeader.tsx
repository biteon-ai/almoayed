"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  isTeacherNavItemActive,
  teacherBackFallbackHref,
  teacherMobilePageTitle,
  TEACHER_NAV_ITEMS,
  type TeacherNavItem,
} from "@/lib/teacher-nav";
import {
  TeacherNavLink,
  teacherNavLinkClass,
} from "@/components/layout/TeacherNavLink";
import { TeacherBackButton } from "@/components/layout/TeacherBackButton";
import { LogoutActionButton } from "@/components/layout/LogoutActionButton";
import { NavbarProgress } from "@/components/layout/NavbarProgress";
import { SPEKIT } from "@/lib/spekit-targets";
import { cn } from "@/lib/utils";

function DesktopNavLink({
  item,
  pathname,
}: {
  item: TeacherNavItem;
  pathname: string;
}) {
  const active = isTeacherNavItemActive(item, pathname);

  return (
    <TeacherNavLink
      item={item}
      className={teacherNavLinkClass(
        active,
        "relative px-3 py-2 text-sm font-medium transition-colors"
      )}
    >
      {item.label}
      {active && (
        <span
          className="absolute inset-x-3 -bottom-0.5 h-0.5 rounded-full bg-brand-600"
          aria-hidden
        />
      )}
    </TeacherNavLink>
  );
}

export function TeacherHeader({ slogan }: { slogan: string }) {
  const pathname = usePathname() ?? "";
  const backHref = teacherBackFallbackHref(pathname);
  const mobileTitle = teacherMobilePageTitle(pathname);
  const isHome =
    pathname === "/teacher/dashboard" ||
    pathname.startsWith("/teacher/dashboard/");

  return (
    <header className="sticky top-0 z-50 border-b border-border/80 bg-background/90 backdrop-blur-md">
      <NavbarProgress />
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3 md:gap-4 md:py-4">
        <div className="flex min-w-0 flex-1 items-center gap-2 md:gap-10">
          {backHref ? (
            <div className="md:hidden">
              <TeacherBackButton fallbackHref={backHref} />
            </div>
          ) : null}

          <Link
            href="/teacher/dashboard"
            className="min-w-0 flex-1 text-start md:flex-none md:shrink-0"
          >
            <span className="block truncate text-lg font-bold tracking-tight text-brand-700 dark:text-brand-400 md:text-2xl">
              <span className="md:hidden">{mobileTitle}</span>
              <span className="hidden md:inline">لوحة الأستاذ</span>
            </span>
            {isHome ? (
              <span className="mt-0.5 block truncate text-[11px] font-medium text-muted-foreground md:text-xs">
                {slogan}
              </span>
            ) : (
              <span className="mt-0.5 hidden truncate text-xs font-medium text-muted-foreground md:block">
                {slogan}
              </span>
            )}
          </Link>

          <nav
            aria-label="التنقل الرئيسي"
            className="hidden items-center gap-1 md:flex"
            data-spekit={SPEKIT.teacherLayoutNav}
          >
            {TEACHER_NAV_ITEMS.filter(
              (item) => item.pathMatch !== "/teacher/settings"
            ).map((item) => (
              <DesktopNavLink
                key={item.href}
                item={item}
                pathname={pathname}
              />
            ))}
          </nav>
        </div>

        <div className="flex shrink-0 items-center gap-1">
          <LogoutActionButton
            className={cn(
              "rounded-xl text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
            aria-label="خروج"
          />
        </div>
      </div>
    </header>
  );
}
