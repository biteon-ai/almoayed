"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import type { MouseEvent } from "react";
import {
  isStudentNavItemActive,
  navigateStudentNavItem,
  type StudentNavItem,
  useStudentRouteHash,
} from "@/lib/student-nav";
import { cn } from "@/lib/utils";

type StudentNavLinkProps = {
  item: StudentNavItem;
  className?: string;
  children: React.ReactNode;
  onNavigate?: () => void;
};

export function StudentNavLink({
  item,
  className,
  children,
  onNavigate,
}: StudentNavLinkProps) {
  const pathname = usePathname();
  const router = useRouter();
  const hash = useStudentRouteHash();
  const active = isStudentNavItemActive(item, pathname, hash);

  const handleClick = (event: MouseEvent<HTMLAnchorElement>) => {
    const isSameDashboardRoute =
      item.pathMatch === "/dashboard" && pathname === "/dashboard";

    if (isSameDashboardRoute) {
      event.preventDefault();
      navigateStudentNavItem(item, {
        pathname,
        push: (url) => router.push(url),
      });
      onNavigate?.();
    }
  };

  return (
    <Link href={item.href} onClick={handleClick} className={className}>
      {children}
      {active ? <span className="sr-only"> (الصفحة الحالية)</span> : null}
    </Link>
  );
}

export function studentNavLinkClass(active: boolean, base: string) {
  return cn(base, active ? "text-brand-700" : "text-slate-500 hover:text-slate-700");
}
