export type Appearance = "light" | "dark" | "system";

export const APPEARANCE_STORAGE_KEY = "almoayed-appearance";

export const APPEARANCE_THEME_COLORS = {
  light: "#0d9488",
  dark: "#042626",
} as const;

/**
 * Inline paint colors for FOUC prevention (match globals.css --background).
 * Applied on <html> before CSS loads so hard reload never flashes white in dark mode.
 */
export const APPEARANCE_PAGE_BG = {
  light: "#f7f9fb", // hsl(210 20% 98%)
  dark: "#0f172a", // slate-900 — close to hsl(215 28% 8%)
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
  const root = document.documentElement;
  root.classList.toggle("dark", scheme === "dark");
  root.style.colorScheme = scheme;
  root.style.backgroundColor = APPEARANCE_PAGE_BG[scheme];
  if (document.body) {
    document.body.style.backgroundColor = APPEARANCE_PAGE_BG[scheme];
  }
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) {
    meta.setAttribute("content", APPEARANCE_THEME_COLORS[scheme]);
  }
}

/**
 * Blocking head script — sets .dark + inline page background before first paint.
 * Keep in sync with applyAppearanceClass / APPEARANCE_PAGE_BG.
 */
export const APPEARANCE_FOUC_SCRIPT = `(function(){try{var k=${JSON.stringify(
  APPEARANCE_STORAGE_KEY
)};var v=localStorage.getItem(k);var a=v==="light"||v==="dark"||v==="system"?v:"system";var dark=a==="dark"||(a==="system"&&window.matchMedia("(prefers-color-scheme: dark)").matches);var root=document.documentElement;root.classList.toggle("dark",dark);root.style.colorScheme=dark?"dark":"light";var bg=dark?${JSON.stringify(
  APPEARANCE_PAGE_BG.dark
)}:${JSON.stringify(
  APPEARANCE_PAGE_BG.light
)};root.style.backgroundColor=bg;var b=document.body;if(b)b.style.backgroundColor=bg;var meta=document.querySelector('meta[name="theme-color"]');if(meta)meta.setAttribute("content",dark?${JSON.stringify(
  APPEARANCE_THEME_COLORS.dark
)}:${JSON.stringify(APPEARANCE_THEME_COLORS.light)});}catch(e){}})();`;

/** Critical CSS in <head> so html/body never paint browser-default white. */
export const APPEARANCE_FOUC_STYLE = `html{background-color:${APPEARANCE_PAGE_BG.light}}html.dark{background-color:${APPEARANCE_PAGE_BG.dark};color-scheme:dark}body{background-color:inherit}`;
