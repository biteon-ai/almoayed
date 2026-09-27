/**
 * Device-local hint for which portal was last used for PWA install / login.
 * Used by standalone marketing `/` redirect (UI-021).
 */
export type PwaPortal = "student" | "teacher";

export const PWA_PORTAL_STORAGE_KEY = "almoayed-pwa-portal";

export function setPwaPortal(portal: PwaPortal): void {
  if (typeof localStorage === "undefined") return;
  try {
    localStorage.setItem(PWA_PORTAL_STORAGE_KEY, portal);
  } catch {
    // Private mode / quota — ignore
  }
}

export function getPwaPortal(): PwaPortal {
  if (typeof localStorage === "undefined") return "student";
  try {
    const value = localStorage.getItem(PWA_PORTAL_STORAGE_KEY);
    return value === "teacher" ? "teacher" : "student";
  } catch {
    return "student";
  }
}

/** Standalone entry path when marketing `/` is opened as an installed PWA. */
export function standaloneEntryPath(portal: PwaPortal = getPwaPortal()): string {
  return portal === "teacher" ? "/teacher/login" : "/login";
}
