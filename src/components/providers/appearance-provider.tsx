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
import {
  applyAppearanceClass,
  readAppearance,
  resolveScheme,
  writeAppearance,
  type Appearance,
} from "@/lib/appearance";

type AppearanceContextValue = {
  appearance: Appearance;
  scheme: "light" | "dark";
  setAppearance: (value: Appearance) => void;
};

const AppearanceContext = createContext<AppearanceContextValue | null>(null);

function prefersDarkFromWindow(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return window.matchMedia("(prefers-color-scheme: dark)").matches;
  } catch {
    return false;
  }
}

export function AppearanceProvider({ children }: { children: ReactNode }) {
  const [appearance, setAppearanceState] = useState<Appearance>("system");
  const [prefersDark, setPrefersDark] = useState(false);

  useEffect(() => {
    try {
      setAppearanceState(readAppearance());
      setPrefersDark(prefersDarkFromWindow());
    } catch {
      // Storage / matchMedia blocked — keep defaults.
    }

    let media: MediaQueryList | null = null;
    const onChange = () => {
      try {
        setPrefersDark(prefersDarkFromWindow());
      } catch {
        /* ignore */
      }
    };

    try {
      media = window.matchMedia("(prefers-color-scheme: dark)");
      media.addEventListener("change", onChange);
    } catch {
      media = null;
    }

    return () => {
      try {
        media?.removeEventListener("change", onChange);
      } catch {
        /* ignore */
      }
    };
  }, []);

  const scheme = resolveScheme(appearance, prefersDark);

  useEffect(() => {
    try {
      applyAppearanceClass(scheme);
    } catch {
      // DOM / meta theme-color write failed — non-fatal.
    }
  }, [scheme]);

  const setAppearance = useCallback((value: Appearance) => {
    try {
      writeAppearance(value);
    } catch {
      /* ignore */
    }
    setAppearanceState(value);
  }, []);

  const value = useMemo(
    () => ({ appearance, scheme, setAppearance }),
    [appearance, scheme, setAppearance]
  );

  return (
    <AppearanceContext.Provider value={value}>
      {children}
    </AppearanceContext.Provider>
  );
}

export function useAppearance(): AppearanceContextValue {
  const context = useContext(AppearanceContext);
  if (!context) {
    throw new Error("useAppearance must be used within AppearanceProvider");
  }
  return context;
}
