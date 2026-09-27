"use client";

import { useEffect } from "react";
import { setPwaPortal, type PwaPortal } from "@/lib/pwa-portal";

/** Marks the active PWA portal on login shells for standalone `/` routing. */
export function PwaPortalMarker({ portal }: { portal: PwaPortal }) {
  useEffect(() => {
    setPwaPortal(portal);
  }, [portal]);

  return null;
}
