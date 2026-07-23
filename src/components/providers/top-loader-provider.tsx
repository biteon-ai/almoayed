"use client";

import { Suspense, useEffect, useLayoutEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import {
  AppProgressBar as ProgressBar,
  stopProgress,
} from "next-nprogress-bar";

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

  useEffect(() => {
    stopProgress(true);
  }, []);

  return null;
}

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
