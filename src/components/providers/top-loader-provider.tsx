"use client";

import { Suspense, useEffect, useLayoutEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import {
  AppProgressBar as ProgressBar,
  stopProgress,
} from "next-nprogress-bar";

/**
 * Clears the global route progress bar after navigation completes (App Router + hash).
 */
function NavigationEventListener() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useLayoutEffect(() => {
    stopProgress(true);
  }, [pathname, searchParams]);

  useEffect(() => {
    const finish = () => stopProgress(true);
    finish();
    window.addEventListener("hashchange", finish);
    return () => window.removeEventListener("hashchange", finish);
  }, [pathname, searchParams]);

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
      <ProgressBar
        height="3px"
        color="#10b981"
        shallowRouting
        stopDelay={150}
        startPosition={0.1}
        options={{
          showSpinner: false,
          trickleSpeed: 100,
          minimum: 0.1,
        }}
      />
      <Suspense fallback={null}>
        <NavigationEventListener />
      </Suspense>
      {children}
    </>
  );
}
