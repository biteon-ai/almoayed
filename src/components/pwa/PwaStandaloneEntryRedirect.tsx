"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { isPwaStandalone } from "@/lib/pwa-install";
import { standaloneEntryPath } from "@/lib/pwa-portal";

/**
 * UI-012 / UI-021: Installed PWAs (esp. iOS) must not stay on marketing `/`.
 * Portal hint (`almoayed-pwa-portal`) chooses teacher vs student login.
 */
export function PwaStandaloneEntryRedirect() {
  const router = useRouter();

  useEffect(() => {
    if (!isPwaStandalone()) return;
    router.replace(standaloneEntryPath());
  }, [router]);

  return null;
}
