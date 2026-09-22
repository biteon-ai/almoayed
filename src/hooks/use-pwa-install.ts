"use client";

import { useCallback, useEffect, useState } from "react";
import {
  isPwaStandalone,
  type BeforeInstallPromptEvent,
} from "@/lib/pwa-install";

/**
 * Captures Chromium `beforeinstallprompt` so Android can trigger a native
 * install sheet. iOS never fires this event — callers must show manual steps.
 */
export function usePwaInstall() {
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [installed, setInstalled] = useState(false);
  /** False until the client has evaluated display-mode / iOS standalone. */
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const syncInstalled = () => setInstalled(isPwaStandalone());
    syncInstalled();
    setReady(true);

    const media = window.matchMedia("(display-mode: standalone)");
    media.addEventListener("change", syncInstalled);

    const onBeforeInstall = (event: Event) => {
      event.preventDefault();
      setDeferredPrompt(event as BeforeInstallPromptEvent);
    };

    const onInstalled = () => {
      setDeferredPrompt(null);
      setInstalled(true);
    };

    window.addEventListener("beforeinstallprompt", onBeforeInstall);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      media.removeEventListener("change", syncInstalled);
      window.removeEventListener("beforeinstallprompt", onBeforeInstall);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  const promptInstall = useCallback(async (): Promise<"accepted" | "dismissed" | "unavailable"> => {
    if (!deferredPrompt) return "unavailable";
    try {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      setDeferredPrompt(null);
      if (outcome === "accepted") setInstalled(true);
      return outcome;
    } catch {
      setDeferredPrompt(null);
      return "unavailable";
    }
  }, [deferredPrompt]);

  return {
    canPrompt: deferredPrompt !== null && !installed,
    installed,
    ready,
    promptInstall,
  };
}
