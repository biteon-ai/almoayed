"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { isPwaStandalone } from "@/lib/pwa-install";

/**
 * UI-012: Installed PWAs (esp. iOS) must not stay on marketing `/`.
 * Covers older home-screen installs that still open `start_url: "/"` and
 * any cold start that lands on the landing page in standalone mode.
 * Unauthenticated only — signed-in visitors never render LandingPageView
 * (server redirect on `/`).
 */
export function PwaStandaloneEntryRedirect() {
  const router = useRouter();

  useEffect(() => {
    if (!isPwaStandalone()) return;
    router.replace("/login");
  }, [router]);

  return null;
}
