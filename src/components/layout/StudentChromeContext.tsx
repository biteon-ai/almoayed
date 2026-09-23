"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { shouldUseQuizImmersiveChrome } from "@/lib/student-chrome";

type StudentChromeContextValue = {
  /** Register/unregister the immersive quiz player (UI-016). */
  setQuizPlayerMounted: (mounted: boolean) => void;
};

const StudentChromeContext = createContext<StudentChromeContextValue | null>(
  null
);

export function StudentChromeProvider({ children }: { children: ReactNode }) {
  const [quizPlayerMounted, setQuizPlayerMountedState] = useState(false);

  const setQuizPlayerMounted = useCallback((mounted: boolean) => {
    setQuizPlayerMountedState(mounted);
  }, []);

  const value = useMemo(
    () => ({ setQuizPlayerMounted }),
    [setQuizPlayerMounted]
  );

  return (
    <StudentChromeContext.Provider value={value}>
      <StudentChromeImmersiveBridge mounted={quizPlayerMounted}>
        {children}
      </StudentChromeImmersiveBridge>
    </StudentChromeContext.Provider>
  );
}

const ImmersiveContext = createContext(false);

function StudentChromeImmersiveBridge({
  mounted,
  children,
}: {
  mounted: boolean;
  children: ReactNode;
}) {
  const immersive = shouldUseQuizImmersiveChrome(mounted);
  return (
    <ImmersiveContext.Provider value={immersive}>
      {children}
    </ImmersiveContext.Provider>
  );
}

export function useStudentQuizImmersive(): boolean {
  return useContext(ImmersiveContext);
}

/**
 * While QuizRunner is mounted, hide hub header/bottom nav so QuizPlayerHeader
 * is the sole chrome. Safe no-op outside StudentChromeProvider (e.g. tests).
 */
export function useQuizPlayerChrome(active: boolean): void {
  const ctx = useContext(StudentChromeContext);
  useEffect(() => {
    if (!ctx || !active) return;
    ctx.setQuizPlayerMounted(true);
    return () => ctx.setQuizPlayerMounted(false);
  }, [active, ctx]);
}
