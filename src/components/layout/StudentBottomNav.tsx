"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import {
  isStudentNavItemActive,
  STUDENT_NAV_ITEMS,
} from "@/lib/student-nav";
import { cn } from "@/lib/utils";

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

export function StudentBottomNav() {
  const pathname = usePathname();
  const hash = useRouteHash();
  const items = STUDENT_NAV_ITEMS.filter((item) => item.bottomNav);

  return (
    <nav
      aria-label="التنقل السفلي"
      className="fixed inset-x-0 bottom-0 z-50 border-t border-slate-100 bg-white/95 backdrop-blur-md md:hidden safe-bottom"
    >
      <div className="mx-auto flex max-w-lg items-stretch justify-around px-2 py-1.5">
        {items.map((item) => {
          const active = isStudentNavItemActive(item, pathname, hash);
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex min-w-0 flex-1 flex-col items-center justify-center gap-0.5 rounded-xl px-1 py-2 transition-colors",
                active
                  ? "text-brand-700"
                  : "text-slate-500 hover:text-slate-700"
              )}
            >
              <Icon
                className={cn("size-5", active && "text-brand-600")}
                aria-hidden
              />
              <span className="truncate text-[10px] font-bold">{item.label}</span>
              {active && (
                <span className="size-1 rounded-full bg-emerald-600" aria-hidden />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
