"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
} from "react";
import {
  startProgress,
  stopProgress,
} from "next-nprogress-bar";

type StudentLoadingContextValue = {
  withLoading: <T>(fn: () => Promise<T>) => Promise<T>;
};

const StudentLoadingContext = createContext<StudentLoadingContextValue | null>(
  null
);

export function useStudentLoadingBar() {
  const context = useContext(StudentLoadingContext);
  if (!context) {
    throw new Error("useStudentLoadingBar must be used within StudentPortalShell");
  }
  return context;
}

/** Syncs top loading bar with a boolean (e.g. useTransition pending). Safe outside shell. */
export function useStudentLoadingBarSync(active: boolean) {
  useEffect(() => {
    if (!active) return;
    startProgress();
    return () => stopProgress(true);
  }, [active]);
}

export function StudentPortalShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const withLoading = useCallback(async <T,>(fn: () => Promise<T>) => {
    startProgress();
    try {
      return await fn();
    } finally {
      stopProgress(true);
    }
  }, []);

  return (
    <StudentLoadingContext.Provider value={{ withLoading }}>
      {children}
    </StudentLoadingContext.Provider>
  );
}
