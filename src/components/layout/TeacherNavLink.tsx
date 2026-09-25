"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import type { MouseEvent } from "react";
import {
  isTeacherNavItemActive,
  type TeacherNavItem,
} from "@/lib/teacher-nav";
import { cn } from "@/lib/utils";

type TeacherNavLinkProps = {
  item: TeacherNavItem;
  className?: string;
  children: React.ReactNode;
};

export function TeacherNavLink({
  item,
  className,
  children,
}: TeacherNavLinkProps) {
  const pathname = usePathname() ?? "";
  const router = useRouter();
  const active = isTeacherNavItemActive(item, pathname);

  const handleClick = (event: MouseEvent<HTMLAnchorElement>) => {
    if (item.href === pathname) return;

    event.preventDefault();
    const go = () => {
      router.push(item.href);
    };

    const doc = document as Document & {
      startViewTransition?: (callback: () => void) => void;
    };
    if (typeof doc.startViewTransition === "function") {
      doc.startViewTransition(go);
      return;
    }
    go();
  };

  return (
    <Link href={item.href} onClick={handleClick} className={className}>
      {children}
      {active ? <span className="sr-only"> (الصفحة الحالية)</span> : null}
    </Link>
  );
}

export function teacherNavLinkClass(active: boolean, base: string) {
  return cn(
    base,
    active
      ? "text-brand-700 dark:text-brand-400"
      : "text-muted-foreground hover:text-foreground"
  );
}
