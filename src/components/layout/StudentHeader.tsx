"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  isStudentNavItemActive,
  STUDENT_NAV_ITEMS,
  type StudentNavItem,
  useStudentRouteHash,
} from "@/lib/student-nav";
import { cn } from "@/lib/utils";
import {
  StudentNavLink,
  studentNavLinkClass,
} from "@/components/layout/StudentNavLink";
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

  return (
    <header className="sticky top-0 z-50 border-b border-border/80 bg-background/90 backdrop-blur-md">
      <NavbarProgress />
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 md:py-4">
        <div className="flex min-w-0 flex-1 items-center gap-6 md:gap-10">
          <Link href="/dashboard" className="min-w-0 shrink-0 text-start">
            <span className="block text-xl font-bold tracking-tight text-brand-700 dark:text-brand-400 md:text-2xl">
              المؤيد
            </span>
            <span className="mt-0.5 block truncate text-[11px] font-medium text-muted-foreground md:text-xs">
              {slogan}
            </span>
          </Link>

          <nav
            aria-label="التنقل الرئيسي"
            className="hidden items-center gap-1 md:flex"
          >
            {STUDENT_NAV_ITEMS.map((item) => (
              <DesktopNavLink
                key={item.href}
                item={item}
                pathname={pathname}
                hash={hash}
              />
            ))}
          </nav>
        </div>

        <div className="flex shrink-0 items-center gap-1">
          <button
            type="button"
            onClick={() => setDrawerOpen(true)}
            className={cn(
              buttonVariants({ variant: "ghost", size: "icon" }),
              "rounded-xl text-muted-foreground hover:bg-muted"
            )}
            aria-label="الإعدادات"
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
