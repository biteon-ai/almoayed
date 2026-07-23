"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { SPEKIT, spekit } from "@/lib/spekit-targets";

function isInternalNavAnchor(anchor: HTMLAnchorElement): boolean {
  if (anchor.target === "_blank") return false;

  const href = anchor.getAttribute("href");
  if (
    !href ||
    href.startsWith("#") ||
    href.startsWith("mailto:") ||
    href.startsWith("tel:") ||
    href.startsWith("javascript:")
  ) {
    return false;
  }

  try {
    const target = new URL(anchor.href);
    const current = new URL(window.location.href);
    if (target.origin !== current.origin) return false;
    return !(
      target.pathname === current.pathname && target.search === current.search
    );
  } catch {
    return false;
  }
}

function NavbarProgressInner() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isNavigating, setIsNavigating] = useState(false);
  const isFirstRouteEffect = useRef(true);

  // Instant feedback on internal link clicks (before the route paints)
  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      if (event.defaultPrevented) return;
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
        return;
      }
      if (event.button !== 0) return;

      let element = event.target as Element | null;
      while (element && element.tagName !== "A") {
        element = element.parentElement;
      }
      if (!(element instanceof HTMLAnchorElement)) return;
      if (!isInternalNavAnchor(element)) return;

      setIsNavigating(true);
    };

    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, []);

  // Keep the bar visible briefly after the route commits
  useEffect(() => {
    if (isFirstRouteEffect.current) {
      isFirstRouteEffect.current = false;
      return;
    }

    setIsNavigating(true);
    const timer = window.setTimeout(() => setIsNavigating(false), 400);
    return () => window.clearTimeout(timer);
  }, [pathname, searchParams]);

  if (!isNavigating) return null;

  return (
    <div
      role="progressbar"
      aria-busy="true"
      aria-valuetext="جاري التحميل"
      {...spekit(SPEKIT.navbarProgress)}
      className="pointer-events-none absolute inset-x-0 bottom-0 z-50 h-1 w-full overflow-hidden bg-emerald-50 dark:bg-emerald-950/40"
      style={{ direction: "ltr" }}
    >
      <div className="h-full w-full origin-left animate-pulse rounded-full bg-emerald-600" />
    </div>
  );
}

/**
 * [UI-006] Lightweight progress line on the bottom edge of sticky headers.
 * Pure default Tailwind (`animate-pulse`) — no custom keyframes.
 */
export function NavbarProgress() {
  return (
    <Suspense fallback={null}>
      <NavbarProgressInner />
    </Suspense>
  );
}
