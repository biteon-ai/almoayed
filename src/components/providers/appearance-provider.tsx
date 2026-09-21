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
  return window.matchMedia("(prefers-color-scheme: dark)").matches;
}

export function AppearanceProvider({ children }: { children: ReactNode }) {
  const [appearance, setAppearanceState] = useState<Appearance>("system");
  const [prefersDark, setPrefersDark] = useState(false);

  useEffect(() => {
    setAppearanceState(readAppearance());
    setPrefersDark(prefersDarkFromWindow());

    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => setPrefersDark(media.matches);
    media.addEventListener("change", onChange);
    return () => media.removeEventListener("change", onChange);
  }, []);

  const scheme = resolveScheme(appearance, prefersDark);

  useEffect(() => {
    applyAppearanceClass(scheme);
  }, [scheme]);

  const setAppearance = useCallback((value: Appearance) => {
    writeAppearance(value);
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
