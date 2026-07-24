"use client";

import { useEffect, useRef, useState } from "react";
import { NProgress } from "nprogress-v2";
import {
  startProgress,
  stopProgress,
} from "next-nprogress-bar";
import { SPEKIT } from "@/lib/spekit-targets";
import { cn } from "@/lib/utils";

const LOGIN_PROGRESS_CLASS = "login-progress-active";

/** Ensure NProgress is configured for visible trickle during Server Actions. */
function ensureNProgressConfigured(): void {
  NProgress.configure({
    showSpinner: false,
    trickle: true,
    trickleSpeed: 160,
    minimum: 0.08,
    easing: "ease",
    speed: 280,
  });
}

function setLoginProgressActive(on: boolean): void {
  if (typeof document === "undefined") return;
  document.documentElement.classList.toggle(LOGIN_PROGRESS_CLASS, on);
}

/** UI-006 — start top nav loader (login, logout, heavy actions). */
export function startTopNavLoader(): void {
  ensureNProgressConfigured();
  if (!NProgress.isStarted()) {
    NProgress.set(0.08);
  }
  NProgress.start();
  try {
    startProgress();
  } catch {
    /* ProgressBar may not be mounted yet */
  }
}

/** UI-006 — finish/hide top nav loader (route painted or auth error). */
export function stopTopNavLoader(force = true): void {
  try {
    stopProgress(force);
  } catch {
    /* ignore */
  }
  if (NProgress.isStarted() || force) {
    NProgress.done(force);
  }
}

/**
 * FIX-UI-002 — keep the bar actively moving toward ~90% while a Server Action runs.
 */
export function pulseTopNavLoaderTowardPeak(peak = 0.9): void {
  ensureNProgressConfigured();
  if (!NProgress.isStarted()) {
    NProgress.set(0.08);
    NProgress.start();
  }
  const status = typeof NProgress.status === "number" ? NProgress.status : 0.08;
  if (status >= peak) return;
  const next = Math.min(peak, status + Math.max(0.025, (peak - status) * 0.18));
  NProgress.set(next);
}

export function completeTopNavLoader(): void {
  ensureNProgressConfigured();
  NProgress.set(1);
  stopTopNavLoader(true);
}

/**
 * Attaches `data-spekit="top-nav-loader"` to the NProgress root as soon as it mounts.
 */
export function TopNavLoaderSpekitBridge() {
  useEffect(() => {
    const tag = () => {
      const root = document.getElementById("nprogress");
      if (!root) return;
      root.setAttribute("data-spekit", SPEKIT.topNavLoader);
      root.setAttribute("role", "progressbar");
      root.setAttribute("aria-busy", "true");
      root.setAttribute("aria-valuetext", "جاري التحميل");
    };

    tag();
    const observer = new MutationObserver(tag);
    observer.observe(document.documentElement, {
      childList: true,
      subtree: true,
    });
    return () => observer.disconnect();
  }, []);

  return null;
}

/**
 * FIX-UI-002 / FIX-UI-003 — single top progress bar for login Server Actions.
 * Grows from the left (dir=ltr) so RTL page chrome does not leave a stuck right segment.
 * Hides #nprogress via `html.login-progress-active` while visible.
 */
export function ActiveLoginLoaderBar({ active }: { active: boolean }) {
  const [visible, setVisible] = useState(false);
  const [percent, setPercent] = useState(0);
  const trickleRef = useRef<number | null>(null);
  const hideRef = useRef<number | null>(null);

  useEffect(() => {
    const clearTimers = () => {
      if (trickleRef.current !== null) {
        window.clearInterval(trickleRef.current);
        trickleRef.current = null;
      }
      if (hideRef.current !== null) {
        window.clearTimeout(hideRef.current);
        hideRef.current = null;
      }
    };

    if (active) {
      clearTimers();
      setVisible(true);
      setPercent(6);
      setLoginProgressActive(true);
      // Drive NProgress state for route handoff, but CSS hides its DOM while this bar is up.
      startTopNavLoader();
      trickleRef.current = window.setInterval(() => {
        setPercent((p) => {
          if (p >= 90) return p;
          return Math.min(90, p + Math.max(1.4, (92 - p) * 0.1));
        });
        pulseTopNavLoaderTowardPeak(0.9);
      }, 160);
      return () => {
        clearTimers();
      };
    }

    clearTimers();
    if (!visible && percent === 0) {
      setLoginProgressActive(false);
      return;
    }

    setPercent(100);
    completeTopNavLoader();
    hideRef.current = window.setTimeout(() => {
      setVisible(false);
      setPercent(0);
      setLoginProgressActive(false);
    }, 260);

    return () => {
      if (hideRef.current !== null) window.clearTimeout(hideRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active]);

  useEffect(() => {
    return () => setLoginProgressActive(false);
  }, []);

  if (!visible) return null;

  return (
    <div
      role="progressbar"
      aria-busy={active}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(percent)}
      aria-valuetext="جاري تسجيل الدخول"
      data-spekit={SPEKIT.activeLoginLoader}
      className="pointer-events-none fixed inset-x-0 top-0 z-[100000] h-[3px] overflow-hidden bg-transparent"
      /* Force LTR fill geometry so width% grows left→right (no RTL right stub). */
      style={{ direction: "ltr" }}
    >
      <div
        className={cn(
          "h-full bg-emerald-500 shadow-[0_0_8px_rgb(16_185_129_/_0.35)]",
          "transition-[width] duration-200 ease-out"
        )}
        style={{ width: `${percent}%` }}
      />
    </div>
  );
}

/**
 * Sync NProgress trickle with a pending boolean (route / non-login actions).
 */
export function useActiveLoginLoader(active: boolean): void {
  useEffect(() => {
    if (!active) {
      completeTopNavLoader();
      return;
    }
    startTopNavLoader();
    const id = window.setInterval(() => pulseTopNavLoaderTowardPeak(0.9), 160);
    return () => {
      window.clearInterval(id);
    };
  }, [active]);
}
