export type Appearance = "light" | "dark" | "system";

export const APPEARANCE_STORAGE_KEY = "almoayed-appearance";

export const APPEARANCE_THEME_COLORS = {
  light: "#0d9488",
  dark: "#042626",
} as const;

/**
 * Inline paint colors for FOUC prevention.
 * dark = Tailwind slate-950; light ≈ globals --background.
 */
export const APPEARANCE_PAGE_BG = {
  light: "#ffffff",
  dark: "#020617",
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
  root.classList.toggle("light", scheme === "light");
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
 * Blocking sync script — inject inside <head> (never as a direct <html> child).
 * Sets .dark / .light + inline backgrounds from localStorage or system preference.
 */
export const APPEARANCE_FOUC_SCRIPT = `(function(){try{var k=${JSON.stringify(
  APPEARANCE_STORAGE_KEY
)};var v=localStorage.getItem(k);var a=v==="light"||v==="dark"||v==="system"?v:"system";var dark=a==="dark"||(a==="system"&&window.matchMedia("(prefers-color-scheme: dark)").matches);var root=document.documentElement;root.classList.toggle("dark",dark);root.classList.toggle("light",!dark);root.style.colorScheme=dark?"dark":"light";var bg=dark?${JSON.stringify(
  APPEARANCE_PAGE_BG.dark
)}:${JSON.stringify(
  APPEARANCE_PAGE_BG.light
)};root.style.backgroundColor=bg;var b=document.body;if(b)b.style.backgroundColor=bg;var meta=document.querySelector('meta[name="theme-color"]');if(meta)meta.setAttribute("content",dark?${JSON.stringify(
  APPEARANCE_THEME_COLORS.dark
)}:${JSON.stringify(APPEARANCE_THEME_COLORS.light)});}catch(e){}})();`;

/**
 * Critical CSS after the FOUC script.
 * - Never paints light-only for prefers-dark users (media query).
 * - html.dark / html.light win once the script sets the class.
 */
export const APPEARANCE_FOUC_STYLE = [
  `html{background-color:${APPEARANCE_PAGE_BG.light}}`,
  `@media (prefers-color-scheme: dark){html:not(.light){background-color:${APPEARANCE_PAGE_BG.dark};color-scheme:dark}}`,
  `html.dark{background-color:${APPEARANCE_PAGE_BG.dark};color-scheme:dark}`,
  `html.light{background-color:${APPEARANCE_PAGE_BG.light};color-scheme:light}`,
  `body{background-color:inherit}`,
].join("");
