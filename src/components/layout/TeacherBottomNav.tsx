"use client";

import { usePathname } from "next/navigation";
import {
  isTeacherNavItemActive,
  TEACHER_NAV_ITEMS,
} from "@/lib/teacher-nav";
import { cn } from "@/lib/utils";
import {
  TeacherNavLink,
  teacherNavLinkClass,
} from "@/components/layout/TeacherNavLink";
import { SPEKIT } from "@/lib/spekit-targets";

export function TeacherBottomNav() {
  const pathname = usePathname() ?? "";
  const items = TEACHER_NAV_ITEMS.filter((item) => item.bottomNav);

  return (
    <nav
      aria-label="التنقل السفلي"
      className="fixed inset-x-0 bottom-0 z-50 border-t border-border/80 bg-background/95 backdrop-blur-md md:hidden safe-bottom"
      data-spekit={SPEKIT.teacherLayoutNavBottom}
    >
      <div className="mx-auto flex max-w-lg items-stretch justify-around px-2 py-1.5">
        {items.map((item) => {
          const active = isTeacherNavItemActive(item, pathname);
          const Icon = item.icon;

          return (
            <TeacherNavLink
              key={item.href}
              item={item}
              className={teacherNavLinkClass(
                active,
                "flex min-w-0 flex-1 flex-col items-center justify-center gap-0.5 rounded-xl px-1 py-2 transition-colors"
              )}
            >
              <Icon
                className={cn("size-5", active && "text-brand-600")}
                aria-hidden
              />
              <span className="truncate text-[10px] font-bold">{item.label}</span>
              {active && (
                <span className="size-1 rounded-full bg-brand-600" aria-hidden />
              )}
            </TeacherNavLink>
          );
        })}
      </div>
    </nav>
  );
}
