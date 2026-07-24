"use client";

import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { SPEKIT, spekit } from "@/lib/spekit-targets";
import { cn } from "@/lib/utils";

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
  const [visible, setVisible] = useState(false);
  const [percent, setPercent] = useState(0);
  const isFirstRouteEffect = useRef(true);
  const trickleRef = useRef<number | null>(null);

  const clearTrickle = useCallback(() => {
    if (trickleRef.current !== null) {
      window.clearInterval(trickleRef.current);
      trickleRef.current = null;
    }
  }, []);

  const begin = useCallback(() => {
    clearTrickle();
    setVisible(true);
    setPercent(8);
    trickleRef.current = window.setInterval(() => {
      setPercent((p) => {
        if (p >= 88) return p;
        const step = Math.max(1.2, (90 - p) * 0.08);
        return Math.min(88, p + step);
      });
    }, 160);
  }, [clearTrickle]);

  const complete = useCallback(() => {
    clearTrickle();
    setPercent(100);
    window.setTimeout(() => {
      setVisible(false);
      setPercent(0);
    }, 280);
  }, [clearTrickle]);

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

      begin();
    };

    document.addEventListener("click", onClick, true);
    return () => {
      document.removeEventListener("click", onClick, true);
      clearTrickle();
    };
  }, [begin, clearTrickle]);

  // Complete after the route commits
  useEffect(() => {
    if (isFirstRouteEffect.current) {
      isFirstRouteEffect.current = false;
      return;
    }

    begin();
    const timer = window.setTimeout(complete, 120);
    return () => window.clearTimeout(timer);
  }, [pathname, searchParams, begin, complete]);

  if (!visible) return null;

  return (
    <div
      role="progressbar"
      aria-busy="true"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(percent)}
      aria-valuetext="جاري التحميل"
      {...spekit(SPEKIT.navbarProgress)}
      className="pointer-events-none absolute inset-x-0 bottom-0 z-50 h-1 w-full overflow-hidden bg-emerald-50 dark:bg-emerald-950/40"
      style={{ direction: "ltr" }}
    >
      <div
        className={cn(
          "h-full rounded-full bg-emerald-600 transition-[width] duration-200 ease-out"
        )}
        style={{
          width: `${percent}%`,
        }}
      />
    </div>
  );
}

/**
 * [UI-006] Incremental progress line on sticky header bottom edge.
 * Trickles toward ~90% while navigating, then completes to 100%.
 */
export function NavbarProgress() {
  return (
    <Suspense fallback={null}>
      <NavbarProgressInner />
    </Suspense>
  );
}
