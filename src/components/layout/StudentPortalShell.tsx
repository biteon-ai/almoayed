"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { usePathname } from "next/navigation";
import { TopLoadingBar } from "@/components/ui/top-loading-bar";
import { useStudentRouteHash } from "@/lib/student-nav";

type StudentLoadingContextValue = {
  startLoading: () => void;
  stopLoading: () => void;
  withLoading: <T>(fn: () => Promise<T>) => Promise<T>;
};

const StudentLoadingContext = createContext<StudentLoadingContextValue | null>(
  null
);

const ROUTE_LOADING_MS = 450;

function isInternalNavigationLink(anchor: HTMLAnchorElement): boolean {
  const href = anchor.getAttribute("href");
  if (!href || href.startsWith("#") || href.startsWith("mailto:") || href.startsWith("tel:")) {
    return false;
  }
  if (anchor.target === "_blank" || anchor.hasAttribute("download")) {
    return false;
  }

  try {
    const url = new URL(href, window.location.origin);
    return url.origin === window.location.origin;
  } catch {
    return false;
  }
}

export function useStudentLoadingBar() {
  const context = useContext(StudentLoadingContext);
  if (!context) {
    throw new Error("useStudentLoadingBar must be used within StudentPortalShell");
  }
  return context;
}

/** Syncs top loading bar with a boolean (e.g. useTransition pending). Safe outside shell. */
export function useStudentLoadingBarSync(active: boolean) {
  const context = useContext(StudentLoadingContext);

  useEffect(() => {
    if (!context || !active) return;
    context.startLoading();
    return () => context.stopLoading();
  }, [active, context]);
}

export function StudentPortalShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const hash = useStudentRouteHash();
  const [asyncCount, setAsyncCount] = useState(0);
  const [routeLoading, setRouteLoading] = useState(false);
  const stopTimerRef = useRef<ReturnType<typeof setTimeout>>();

  const startLoading = useCallback(() => {
    setAsyncCount((count) => count + 1);
  }, []);

  const stopLoading = useCallback(() => {
    setAsyncCount((count) => Math.max(0, count - 1));
  }, []);

  const withLoading = useCallback(
    async <T,>(fn: () => Promise<T>) => {
      startLoading();
      try {
        return await fn();
      } finally {
        stopLoading();
      }
    },
    [startLoading, stopLoading]
  );

  useEffect(() => {
    setRouteLoading(true);
    clearTimeout(stopTimerRef.current);
    stopTimerRef.current = setTimeout(() => setRouteLoading(false), ROUTE_LOADING_MS);
    return () => clearTimeout(stopTimerRef.current);
  }, [pathname, hash]);

  useEffect(() => {
    const handleClick = (event: MouseEvent) => {
      const anchor = (event.target as HTMLElement | null)?.closest("a");
      if (!(anchor instanceof HTMLAnchorElement)) return;
      if (!isInternalNavigationLink(anchor)) return;
      startLoading();
    };

    document.addEventListener("click", handleClick, true);
    return () => document.removeEventListener("click", handleClick, true);
  }, [startLoading]);

  const isLoading = routeLoading || asyncCount > 0;

  return (
    <StudentLoadingContext.Provider
      value={{ startLoading, stopLoading, withLoading }}
    >
      <TopLoadingBar isLoading={isLoading} />
      {children}
    </StudentLoadingContext.Provider>
  );
}
