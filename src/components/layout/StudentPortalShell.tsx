"use client";

import { createContext, useCallback, useContext } from "react";
import {
  useLoadingBarSync,
  withLoadingBar,
} from "@/components/providers/top-loader-provider";

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
export { useLoadingBarSync as useStudentLoadingBarSync };

export function StudentPortalShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const withLoading = useCallback(withLoadingBar, []);

  return (
    <StudentLoadingContext.Provider value={{ withLoading }}>
      {children}
    </StudentLoadingContext.Provider>
  );
}
