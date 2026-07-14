"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ChevronRight, Settings } from "lucide-react";

export type SettingsNavItem = {
  id: string;
  label: string;
};

interface SettingsPageShellProps {
  backHref: string;
  backLabel: string;
  navItems: SettingsNavItem[];
  children: ReactNode;
}

function NavButton({
  item,
  isActive,
  onClick,
  className,
}: {
  item: SettingsNavItem;
  isActive: boolean;
  onClick: () => void;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-current={isActive ? "true" : undefined}
      className={cn(
        "shrink-0 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all duration-200",
        "border border-transparent",
        isActive
          ? "border-brand-200/80 bg-brand-50 text-brand-800 shadow-sm ring-1 ring-brand-100/80"
          : "text-slate-600 hover:border-slate-200 hover:bg-white hover:text-brand-700",
        className
      )}
    >
      {item.label}
    </button>
  );
}

export function SettingsPageShell({
  backHref,
  backLabel,
  navItems,
  children,
}: SettingsPageShellProps) {
  const [activeId, setActiveId] = useState(navItems[0]?.id ?? "");
  const isScrollingRef = useRef(false);

  const scrollToSection = useCallback((id: string) => {
    const el = document.getElementById(id);
    if (!el) return;
    isScrollingRef.current = true;
    setActiveId(id);
    el.scrollIntoView({ behavior: "smooth", block: "start" });
    window.setTimeout(() => {
      isScrollingRef.current = false;
    }, 600);
  }, []);

  useEffect(() => {
    const sectionIds = navItems.map((n) => n.id);
    const elements = sectionIds
      .map((id) => document.getElementById(id))
      .filter(Boolean) as HTMLElement[];

    if (elements.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (isScrollingRef.current) return;
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio);
        if (visible[0]?.target.id) {
          setActiveId(visible[0].target.id);
        }
      },
      { rootMargin: "-20% 0px -55% 0px", threshold: [0, 0.25, 0.5, 1] }
    );

    elements.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [navItems]);

  return (
    <div dir="rtl" className="mx-auto w-full max-w-6xl px-4 py-6 pb-12 md:px-6 md:py-8">
      {/* Page header */}
      <header className="mb-6 space-y-5 md:mb-8">
        <Link
          href={backHref}
          className={cn(
            buttonVariants({ variant: "ghost", size: "sm" }),
            "-me-1 gap-1 text-muted-foreground"
          )}
        >
          <ChevronRight className="size-4" />
          {backLabel}
        </Link>
        <div className="flex items-center gap-3.5 text-start md:gap-4">
          <div className="flex size-12 shrink-0 items-center justify-center rounded-full bg-brand-100/80 text-brand-700 ring-1 ring-brand-200/60 md:size-14">
            <Settings className="size-5 md:size-6" aria-hidden />
          </div>
          <div className="space-y-1">
            <h1 className="text-2xl font-bold tracking-tight text-foreground md:text-3xl">
              الإعدادات
            </h1>
            <p className="text-sm leading-relaxed tracking-wide text-slate-500 md:text-base">
              إدارة حسابك وجلساتك
            </p>
          </div>
        </div>
      </header>

      {/* Mobile: horizontal scroll tabs */}
      <nav
        aria-label="أقسام الإعدادات"
        className="mb-5 flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] md:hidden [&::-webkit-scrollbar]:hidden"
      >
        {navItems.map((item) => (
          <NavButton
            key={item.id}
            item={item}
            isActive={activeId === item.id}
            onClick={() => scrollToSection(item.id)}
          />
        ))}
      </nav>

      {/* Desktop grid + mobile single column */}
      <div className="md:grid md:grid-cols-12 md:gap-8 lg:gap-10">
        {/* Sidebar — desktop only */}
        <aside className="hidden md:col-span-4 md:block lg:col-span-3">
          <nav
            aria-label="أقسام الإعدادات"
            className="sticky top-8 space-y-1.5 rounded-2xl border border-slate-200/80 bg-white p-3 shadow-sm ring-1 ring-slate-900/[0.03]"
          >
            <p className="px-3 pb-2 pt-1 text-xs font-bold uppercase tracking-wider text-slate-400">
              الأقسام
            </p>
            {navItems.map((item) => (
              <NavButton
                key={item.id}
                item={item}
                isActive={activeId === item.id}
                onClick={() => scrollToSection(item.id)}
                className="w-full text-start"
              />
            ))}
          </nav>
        </aside>

        {/* Main content */}
        <main className="min-w-0 space-y-5 md:col-span-8 md:space-y-6 lg:col-span-9 lg:space-y-8">
          {children}
        </main>
      </div>
    </div>
  );
}
