"use client";

import {
  Suspense,
  useCallback,
  useEffect,
  useState,
} from "react";
import { usePathname, useSearchParams } from "next/navigation";
import {
  AppProgressBar as ProgressBar,
  startProgress,
  stopProgress,
  useRouter as useProgressRouter,
} from "next-nprogress-bar";
import {
  TopNavLoaderSpekitBridge,
  startTopNavLoader,
  stopTopNavLoader,
  pulseTopNavLoaderTowardPeak,
  completeTopNavLoader,
} from "@/components/ui/top-loader";

const FINISH_DELAY_MS = 380;

function isInternalNavigationAnchor(anchor: HTMLAnchorElement): boolean {
  if (anchor.target === "_blank") return false;
  if (anchor.getAttribute("data-disable-nprogress") === "true") return false;

  const href = anchor.getAttribute("href");
  if (
    !href ||
    href.startsWith("#") ||
    href.startsWith("mailto:") ||
    href.startsWith("tel:") ||
    href.startsWith("javascript:") ||
    href.startsWith("blob:")
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

/** Starts the bar synchronously before App Router mutates history. */
function NavigationStartListener() {
  useEffect(() => {
    const begin = () => startTopNavLoader();

    const handleDocumentClick = (event: MouseEvent) => {
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
      if (!isInternalNavigationAnchor(element)) return;

      begin();
    };

    const currentPushState = window.history.pushState.bind(window.history);
    const currentReplaceState = window.history.replaceState.bind(
      window.history
    );

    window.history.pushState = (...args) => {
      begin();
      return currentPushState(...args);
    };

    window.history.replaceState = (...args) => {
      begin();
      return currentReplaceState(...args);
    };

    window.addEventListener("click", handleDocumentClick, true);
    window.addEventListener("popstate", begin);

    return () => {
      window.removeEventListener("click", handleDocumentClick, true);
      window.removeEventListener("popstate", begin);
      window.history.pushState = currentPushState;
      window.history.replaceState = currentReplaceState;
    };
  }, []);

  return null;
}

/** Finishes the bar after the next route is painted (prevents stuck animations). */
function RouteFinishListener() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    const finishTimer = window.setTimeout(() => {
      stopTopNavLoader(true);
    }, FINISH_DELAY_MS);

    return () => window.clearTimeout(finishTimer);
  }, [pathname, searchParams]);

  useEffect(() => {
    const finish = () => stopTopNavLoader(true);
    window.addEventListener("hashchange", finish);
    return () => window.removeEventListener("hashchange", finish);
  }, []);

  return null;
}

/**
 * Client-only NProgress mount — avoids SSR/client HTML mismatch from injected <style>
 * or dynamic #nprogress nodes (FIX-UI-001). Styles live in globals.css.
 */
function ClientTopProgressBar() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <>
      <ProgressBar
        height="3px"
        color="#10b981"
        shallowRouting
        startPosition={0}
        stopDelay={FINISH_DELAY_MS}
        delay={0}
        disableStyle
        options={{
          showSpinner: false,
          trickle: true,
          trickleSpeed: 180,
          minimum: 0.08,
          easing: "ease",
          speed: 320,
        }}
      />
      <TopNavLoaderSpekitBridge />
    </>
  );
}

/**
 * [UI-006] App-wide top loading bar — smooth 0% → trickle → 100% via nprogress-v2.
 * Emerald theme, RTL-aligned growth, Spekit `top-nav-loader`.
 * [FIX-UI-001] No inline CSS injection; ProgressBar mounts after hydration.
 */
export function TopLoaderProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      {children}
      <ClientTopProgressBar />
      <Suspense fallback={null}>
        <NavigationStartListener />
        <RouteFinishListener />
      </Suspense>
    </>
  );
}

/** Router wrapper that shows the top bar on programmatic navigation. */
export { useProgressRouter };

/** Manual start/stop controls for heavy client fetches or async actions. */
export function useLoadingBar() {
  const startLoading = useCallback(() => startTopNavLoader(), []);
  const stopLoading = useCallback(() => stopTopNavLoader(true), []);

  return { startLoading, stopLoading };
}

/** Syncs the top loader with a boolean (e.g. `useTransition` pending / login busy). */
export function useLoadingBarSync(active: boolean) {
  useEffect(() => {
    if (!active) {
      completeTopNavLoader();
      return;
    }
    startTopNavLoader();
    const id = window.setInterval(() => pulseTopNavLoaderTowardPeak(0.9), 160);
    return () => {
      window.clearInterval(id);
      // Do not force-complete here when transitioning active→active remounts;
      // inactive branch handles done().
    };
  }, [active]);
}

/** Wraps an async function so the top loader runs until it settles. */
export async function withLoadingBar<T>(fn: () => Promise<T>): Promise<T> {
  startTopNavLoader();
  try {
    return await fn();
  } finally {
    stopTopNavLoader(true);
  }
}

export { startProgress, stopProgress, startTopNavLoader, stopTopNavLoader, completeTopNavLoader };
