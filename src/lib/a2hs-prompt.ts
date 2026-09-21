export const A2HS_DISMISS_KEY = "almoayed-a2hs-dismissed-at";
export const A2HS_SNOOZE_MS = 24 * 60 * 60 * 1000;

export function shouldShowA2hsSheet(input: {
  standalone: boolean;
  isStudent: boolean;
  pathname: string;
  isPhoneViewport: boolean;
  sessionHidden: boolean;
  dismissedAt: string | null;
  now?: number;
}): boolean {
  if (input.standalone) return false;
  if (!input.isStudent) return false;
  if (!input.isPhoneViewport) return false;
  if (input.sessionHidden) return false;
  if (/^\/quiz(\/|$)/.test(input.pathname)) return false;

  if (input.dismissedAt) {
    const dismissed = Date.parse(input.dismissedAt);
    if (!Number.isNaN(dismissed)) {
      const now = input.now ?? Date.now();
      if (now - dismissed < A2HS_SNOOZE_MS) return false;
    }
  }

  return true;
}

export function markA2hsDismissed(now: number = Date.now()): void {
  if (typeof localStorage === "undefined") return;
  try {
    localStorage.setItem(A2HS_DISMISS_KEY, new Date(now).toISOString());
  } catch {
    // ignore
  }
}

export function readA2hsDismissedAt(): string | null {
  if (typeof localStorage === "undefined") return null;
  try {
    return localStorage.getItem(A2HS_DISMISS_KEY);
  } catch {
    return null;
  }
}
