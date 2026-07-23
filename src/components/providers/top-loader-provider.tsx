"use client";

import {
  Suspense,
  useCallback,
  useEffect,
} from "react";
import { usePathname, useSearchParams } from "next/navigation";
import {
  AppProgressBar as ProgressBar,
  startProgress,
  stopProgress,
  useRouter as useProgressRouter,
} from "next-nprogress-bar";

const FINISH_DELAY_MS = 320;

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
    const begin = () => startProgress();

    const handleDocumentClick = (event: MouseEvent) => {
      if (event.defaultPrevented) return;
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
        return;
      }

      let element = event.target as Element | null;
      while (element && element.tagName !== "A") {
        element = element.parentElement;
      }

      if (!(element instanceof HTMLAnchorElement)) return;
      if (!isInternalNavigationAnchor(element)) return;

      begin();
    };

    const currentPushState = window.history.pushState.bind(window.history);
    const currentReplaceState = window.history.replaceState.bind(window.history);

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
      stopProgress(true);
    }, FINISH_DELAY_MS);

    return () => window.clearTimeout(finishTimer);
  }, [pathname, searchParams]);

  useEffect(() => {
    const finish = () => stopProgress(true);
    window.addEventListener("hashchange", finish);
    return () => window.removeEventListener("hashchange", finish);
  }, []);

  return null;
}

/** App-wide top loading bar (RTL emerald theme) via next-nprogress-bar. */
export function TopLoaderProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      {children}
      <ProgressBar
        height="4px"
        color="#10b981"
        shallowRouting
        stopDelay={FINISH_DELAY_MS}
        startPosition={0.12}
        options={{
          showSpinner: false,
          trickleSpeed: 120,
          minimum: 0.12,
          speed: 280,
        }}
      />
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
  const startLoading = useCallback(() => startProgress(), []);
  const stopLoading = useCallback(() => stopProgress(true), []);

  return { startLoading, stopLoading };
}

/** Syncs the top loader with a boolean (e.g. `useTransition` pending). */
export function useLoadingBarSync(active: boolean) {
  useEffect(() => {
    if (!active) return;
    startProgress();
    return () => stopProgress(true);
  }, [active]);
}

/** Wraps an async function so the top loader runs until it settles. */
export async function withLoadingBar<T>(fn: () => Promise<T>): Promise<T> {
  startProgress();
  try {
    return await fn();
  } finally {
    stopProgress(true);
  }
}
