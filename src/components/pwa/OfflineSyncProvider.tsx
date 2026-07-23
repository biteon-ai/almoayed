"use client";

import { useEffect } from "react";
import { subscribeConnectivity } from "@/lib/offline/connectivity";
import { countPendingSubmissions } from "@/lib/offline/pending-queue";
import { flushPendingSubmissions } from "@/lib/offline/sync-processor";

export function OfflineSyncProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    async function tryFlush() {
      const count = await countPendingSubmissions();
      if (count > 0) {
        await flushPendingSubmissions();
      }
    }

    void tryFlush();

    return subscribeConnectivity((online) => {
      if (online) {
        void tryFlush();
      }
    });
  }, []);

  return <>{children}</>;
}
