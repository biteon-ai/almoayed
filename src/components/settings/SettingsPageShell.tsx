"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button-variants";
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
  hideBackLink?: boolean;
  /** Hide the page «الإعدادات» title block on small screens (global chrome already shows it). */
  hideTitleOnMobile?: boolean;
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
        "w-full shrink-0 whitespace-nowrap rounded-xl border px-4 py-2.5 text-start text-sm font-semibold transition-all duration-200",
        isActive
          ? "border-brand-200/80 bg-brand-50 text-brand-800 shadow-sm ring-1 ring-brand-100/80 dark:border-brand-700/60 dark:bg-brand-950/50 dark:text-brand-100 dark:ring-brand-800/40"
          : "border-transparent text-slate-600 hover:border-slate-200 hover:bg-white hover:text-brand-700 dark:text-slate-300 dark:hover:border-slate-600 dark:hover:bg-slate-900 dark:hover:text-brand-200",
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
  hideBackLink = false,
  hideTitleOnMobile = false,
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

  const hideHeaderOnMobile = hideBackLink && hideTitleOnMobile;

  return (
    <div dir="rtl" className="mx-auto w-full max-w-6xl px-4 py-4 pb-12 md:px-6 md:py-6">
      {/* Page header — compact on mobile PWA (UI-019 density) */}
      <header
        className={cn(
          "mb-4 space-y-3 md:mb-6 md:space-y-4",
          hideHeaderOnMobile && "max-md:hidden"
        )}
      >
        {!hideBackLink && (
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
        )}
        <div
          className={cn(
            "flex items-center gap-3 text-start",
            hideTitleOnMobile && "max-md:hidden"
          )}
        >
          <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-brand-100/80 text-brand-700 ring-1 ring-brand-200/60 md:size-12 dark:bg-brand-950/60 dark:text-brand-300 dark:ring-brand-800/50">
            <Settings className="size-4 md:size-5" aria-hidden />
          </div>
          <div className="min-w-0 space-y-0.5">
            <h1 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">
              الإعدادات
            </h1>
            <p className="hidden text-sm leading-snug tracking-wide text-slate-500 sm:block md:text-base dark:text-slate-300">
              إدارة حسابك وجلساتك
            </p>
          </div>
        </div>
      </header>

      <div className="md:grid md:grid-cols-12 md:gap-8 lg:gap-10">
        {/* Sidebar — hidden on mobile, visible from md up (Option B) */}
        <aside className="hidden md:col-span-4 md:block lg:col-span-3">
          <nav
            aria-label="أقسام الإعدادات"
            className={cn(
              "sticky top-8 rounded-2xl border border-slate-200/80 bg-white p-3",
              "shadow-md ring-1 ring-slate-900/[0.03]",
              "dark:border-slate-700 dark:bg-slate-900 dark:ring-white/10"
            )}
          >
            <p className="border-b border-slate-100 px-3 pb-2.5 pt-1 text-xs font-bold uppercase tracking-wider text-slate-400 dark:border-slate-700 dark:text-slate-400">
              الأقسام
            </p>
            <div className="space-y-1 pt-1">
              {navItems.map((item) => (
                <NavButton
                  key={item.id}
                  item={item}
                  isActive={activeId === item.id}
                  onClick={() => scrollToSection(item.id)}
                />
              ))}
            </div>
          </nav>
        </aside>

        {/* Main content — full width on mobile, scrollable sections */}
        <main className="min-w-0 space-y-5 md:col-span-8 md:space-y-6 lg:col-span-9 lg:space-y-8">
          {children}
        </main>
      </div>
    </div>
  );
}
