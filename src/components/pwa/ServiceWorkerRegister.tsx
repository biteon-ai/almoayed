"use client";

import { useEffect } from "react";

export function ServiceWorkerRegister() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;

    if (process.env.NODE_ENV === "development") {
      void navigator.serviceWorker.getRegistrations().then((registrations) =>
        Promise.all(registrations.map((registration) => registration.unregister()))
      );
      return;
    }

    navigator.serviceWorker.register("/sw.js").catch((error) => {
      console.error("[OFFLINE-001] Service worker registration failed:", error);
    });
  }, []);

  return null;
}
