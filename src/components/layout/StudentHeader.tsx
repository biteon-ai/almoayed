"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  isStudentNavItemActive,
  studentBackFallbackHref,
  studentMobilePageTitle,
  STUDENT_NAV_ITEMS,
  type StudentNavItem,
  useStudentRouteHash,
} from "@/lib/student-nav";
import { cn } from "@/lib/utils";
import {
  StudentNavLink,
  studentNavLinkClass,
} from "@/components/layout/StudentNavLink";
import { StudentBackButton } from "@/components/layout/StudentBackButton";
import { StudentLogoutButton } from "@/components/layout/StudentLogoutButton";
import { NavbarProgress } from "@/components/layout/NavbarProgress";
import { StudentProfileDrawer } from "@/components/student/StudentProfileDrawer";
import { buttonVariants } from "@/components/ui/button-variants";
import { Settings } from "lucide-react";

function DesktopNavLink({
  item,
  pathname,
  hash,
}: {
  item: StudentNavItem;
  pathname: string;
  hash: string;
}) {
  const active = isStudentNavItemActive(item, pathname, hash);

  return (
    <StudentNavLink
      item={item}
      className={studentNavLinkClass(
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
    </StudentNavLink>
  );
}

export function StudentHeader({
  slogan,
  currentTeacherId,
}: {
  slogan: string;
  currentTeacherId: string | null;
}) {
  const pathname = usePathname();
  const hash = useStudentRouteHash();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const backHref = studentBackFallbackHref(pathname);
  const mobileTitle = studentMobilePageTitle(pathname);
  const isHome =
    pathname === "/dashboard" || pathname.startsWith("/dashboard/");

  return (
    <header className="sticky top-0 z-50 border-b border-border/80 bg-background/90 backdrop-blur-md">
      <NavbarProgress />
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3 md:gap-4 md:py-4">
        <div className="flex min-w-0 flex-1 items-center gap-2 md:gap-10">
          {/* Mobile: contextual back — hidden on dashboard & live quiz */}
          {backHref ? (
            <div className="md:hidden">
              <StudentBackButton fallbackHref={backHref} />
            </div>
          ) : null}

          <Link
            href="/dashboard"
            className="min-w-0 flex-1 text-start md:flex-none md:shrink-0"
          >
            <span className="block truncate text-lg font-bold tracking-tight text-brand-700 dark:text-brand-400 md:text-2xl">
              <span className="md:hidden">{mobileTitle}</span>
              <span className="hidden md:inline">المؤيد</span>
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
          >
            {STUDENT_NAV_ITEMS.filter(
              (item) => item.pathMatch !== "/settings"
            ).map((item) => (
              <DesktopNavLink
                key={item.href}
                item={item}
                pathname={pathname}
                hash={hash}
              />
            ))}
          </nav>
        </div>

        {/* Desktop: profile drawer + logout. Settings route lives in drawer + mobile bottom nav. */}
        <div className="hidden shrink-0 items-center gap-1 md:flex">
          <button
            type="button"
            onClick={() => setDrawerOpen(true)}
            className={cn(
              buttonVariants({ variant: "ghost", size: "icon" }),
              "rounded-xl text-muted-foreground hover:bg-muted"
            )}
            aria-label="الحساب"
            aria-expanded={drawerOpen}
            aria-haspopup="dialog"
          >
            <Settings className="size-5" />
          </button>
          <StudentLogoutButton />
        </div>
      </div>
      <StudentProfileDrawer
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        currentTeacherId={currentTeacherId}
      />
    </header>
  );
}
