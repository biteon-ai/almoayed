export type Appearance = "light" | "dark" | "system";

export const APPEARANCE_STORAGE_KEY = "almoayed-appearance";

export const APPEARANCE_THEME_COLORS = {
  light: "#0d9488",
  dark: "#042626",
} as const;

export function parseAppearance(raw: string | null): Appearance {
  if (raw === "light" || raw === "dark" || raw === "system") return raw;
  return "system";
}

export function readAppearance(): Appearance {
  if (typeof localStorage === "undefined") return "system";
  try {
    return parseAppearance(localStorage.getItem(APPEARANCE_STORAGE_KEY));
  } catch {
    return "system";
  }
}

export function writeAppearance(value: Appearance): void {
  if (typeof localStorage === "undefined") return;
  try {
    localStorage.setItem(APPEARANCE_STORAGE_KEY, value);
  } catch {
    // Private mode / blocked storage — appearance still applies in-memory.
  }
}

export function resolveScheme(
  value: Appearance,
  prefersDark: boolean
): "light" | "dark" {
  if (value === "light" || value === "dark") return value;
  return prefersDark ? "dark" : "light";
}

export function applyAppearanceClass(scheme: "light" | "dark"): void {
  if (typeof document === "undefined") return;
  document.documentElement.classList.toggle("dark", scheme === "dark");
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) {
    meta.setAttribute("content", APPEARANCE_THEME_COLORS[scheme]);
  }
}

export const APPEARANCE_FOUC_SCRIPT = `(function(){try{var k=${JSON.stringify(APPEARANCE_STORAGE_KEY)};var v=localStorage.getItem(k);var a=v==="light"||v==="dark"||v==="system"?v:"system";var dark=a==="dark"||(a==="system"&&window.matchMedia("(prefers-color-scheme: dark)").matches);document.documentElement.classList.toggle("dark",dark);}catch(e){}})();`;
