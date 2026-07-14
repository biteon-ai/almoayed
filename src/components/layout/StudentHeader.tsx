"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import {
  isStudentNavItemActive,
  STUDENT_NAV_ITEMS,
  type StudentNavItem,
} from "@/lib/student-nav";
import { cn } from "@/lib/utils";
import { StudentLogoutButton } from "@/components/layout/StudentLogoutButton";
import { buttonVariants } from "@/components/ui/button";
import { Settings } from "lucide-react";

function useRouteHash() {
  const [hash, setHash] = useState("");

  useEffect(() => {
    const read = () => setHash(window.location.hash);
    read();
    window.addEventListener("hashchange", read);
    return () => window.removeEventListener("hashchange", read);
  }, []);

  return hash;
}

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
    <Link
      href={item.href}
      className={cn(
        "relative px-3 py-2 text-sm font-medium transition-colors",
        active ? "text-brand-700" : "text-slate-600 hover:text-brand-600"
      )}
    >
      {item.label}
      {active && (
        <span
          className="absolute inset-x-3 -bottom-0.5 h-0.5 rounded-full bg-emerald-600"
          aria-hidden
        />
      )}
    </Link>
  );
}

export function StudentHeader() {
  const pathname = usePathname();
  const hash = useRouteHash();

  return (
    <header className="sticky top-0 z-50 border-b border-slate-100 bg-white/90 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 md:py-4">
        {/* RTL: brand + desktop nav (right) */}
        <div className="flex min-w-0 flex-1 items-center gap-6 md:gap-10">
          <Link href="/dashboard" className="min-w-0 shrink-0 text-start">
            <span className="block text-xl font-bold tracking-tight text-brand-700 md:text-2xl">
              المؤيد
            </span>
            <span className="mt-0.5 block truncate text-[11px] font-medium text-slate-500 md:text-xs">
              حل بيدك ما حدا بفيدك
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

        {/* RTL: utilities (left) */}
        <div className="flex shrink-0 items-center gap-1">
          <Link
            href="/settings"
            className={cn(
              buttonVariants({ variant: "ghost", size: "icon" }),
              "rounded-xl text-slate-600 hover:bg-slate-100 md:hidden"
            )}
            aria-label="الإعدادات"
          >
            <Settings className="size-5" />
          </Link>
          <StudentLogoutButton />
        </div>
      </div>
    </header>
  );
}
