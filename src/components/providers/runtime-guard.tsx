"use client";

import { Component, useEffect, type ReactNode } from "react";
import {
  installBrowserExtensionNoiseFilter,
  isBrowserExtensionNoise,
} from "@/lib/extension-noise";

/**
 * Suppresses known browser-extension runtime noise so Next.js / React
 * do not treat translator / Redux / vault / content-script failures as app crashes.
 * Complements the early &lt;head&gt; EXTENSION_NOISE_GUARD_SCRIPT (idempotent).
 */
export function ExtensionNoiseGuard({ children }: { children: ReactNode }) {
  useEffect(() => installBrowserExtensionNoiseFilter(), []);
  return <>{children}</>;
}

type BoundaryState = { hasError: boolean };

/**
 * Catches render/lifecycle errors in the client tree. Extension-sourced
 * errors are ignored so the UI keeps rendering.
 */
export class ClientErrorBoundary extends Component<
  { children: ReactNode; fallback?: ReactNode },
  BoundaryState
> {
  state: BoundaryState = { hasError: false };

  static getDerivedStateFromError(error: Error): BoundaryState {
    if (isBrowserExtensionNoise(error)) {
      return { hasError: false };
    }
    return { hasError: true };
  }

  componentDidCatch(error: Error): void {
    if (isBrowserExtensionNoise(error)) {
      this.setState({ hasError: false });
      return;
    }
    if (process.env.NODE_ENV !== "production") {
      console.error("[FIX-UI-006] ClientErrorBoundary caught:", error);
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback ?? (
          <div
            dir="rtl"
            className="flex min-h-[40vh] flex-col items-center justify-center gap-3 px-6 py-12 text-center"
            role="alert"
          >
            <p className="text-sm font-extrabold text-foreground">
              صار خطأ غير متوقع
            </p>
            <p className="max-w-sm text-xs text-muted-foreground">
              حدّث الصفحة للمتابعة. إن تكرر الخطأ، جرّب بدون إضافات المتصفح.
            </p>
            <button
              type="button"
              className="h-10 rounded-xl bg-brand-600 px-4 text-sm font-bold text-white hover:bg-brand-700"
              onClick={() => {
                this.setState({ hasError: false });
                window.location.reload();
              }}
            >
              إعادة تحميل الصفحة
            </button>
          </div>
        )
      );
    }
    return this.props.children;
  }
}

/** Outermost client shell: extension noise filter + render error boundary. */
export function RuntimeGuard({ children }: { children: ReactNode }) {
  return (
    <ExtensionNoiseGuard>
      <ClientErrorBoundary>{children}</ClientErrorBoundary>
    </ExtensionNoiseGuard>
  );
}
