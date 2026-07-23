"use client";

import { useState } from "react";
import Link from "next/link";
import { APP_NAME } from "@/lib/constants";
import { LANDING_NAV_LINKS } from "@/lib/landing-content";
import { Button } from "@/components/ui/button"
import { buttonVariants } from "@/components/ui/button-variants";
import { cn } from "@/lib/utils";
import { GraduationCap, Menu, X } from "lucide-react";

export function LandingNav() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-emerald-500/10 bg-background/85 backdrop-blur-md">
      <div className="container mx-auto flex h-14 max-w-7xl items-center justify-between gap-4 px-4 sm:h-16 sm:px-6">
        <Link
          href="/"
          className="flex items-center gap-2 font-black text-foreground"
        >
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-600">
            <GraduationCap className="h-5 w-5" />
          </span>
          <span className="text-lg">{APP_NAME}</span>
        </Link>

        <nav className="hidden items-center gap-6 md:flex">
          {LANDING_NAV_LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="text-sm font-semibold text-muted-foreground transition-colors hover:text-emerald-600"
            >
              {link.label}
            </a>
          ))}
        </nav>

        <div className="hidden items-center gap-2 md:flex">
          <Link
            href="/login"
            className={cn(
              buttonVariants({ variant: "ghost", size: "sm" }),
              "h-11 px-4 font-bold"
            )}
          >
            تسجيل الدخول
          </Link>
          <Link
            href="/login"
            className={cn(
              buttonVariants({ size: "sm" }),
              "h-11 bg-emerald-600 px-5 font-bold text-white hover:bg-emerald-700"
            )}
          >
            ابدأ الآن
          </Link>
        </div>

        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-11 w-11 md:hidden"
          aria-expanded={mobileOpen}
          aria-label={mobileOpen ? "إغلاق القائمة" : "فتح القائمة"}
          onClick={() => setMobileOpen((open) => !open)}
        >
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>
      </div>

      {mobileOpen && (
        <div className="border-t border-emerald-500/10 bg-background px-4 py-4 md:hidden">
          <nav className="flex flex-col gap-1">
            {LANDING_NAV_LINKS.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="flex h-11 items-center rounded-xl px-3 text-sm font-semibold text-foreground hover:bg-emerald-50 dark:hover:bg-emerald-950/30"
                onClick={() => setMobileOpen(false)}
              >
                {link.label}
              </a>
            ))}
            <Link
              href="/login"
              className={cn(
                buttonVariants({ variant: "outline" }),
                "mt-2 h-11 w-full font-bold"
              )}
              onClick={() => setMobileOpen(false)}
            >
              تسجيل الدخول
            </Link>
            <Link
              href="/login"
              className={cn(
                buttonVariants(),
                "h-11 w-full bg-emerald-600 font-bold text-white hover:bg-emerald-700"
              )}
              onClick={() => setMobileOpen(false)}
            >
              ابدأ الآن
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
}
