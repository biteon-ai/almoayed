"use client";

import { useCallback, useEffect, useState, useTransition } from "react";
import { CloudUpload, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { isOnline, subscribeConnectivity } from "@/lib/offline/connectivity";
import { countPendingSubmissions } from "@/lib/offline/pending-queue";
import { flushPendingSubmissions } from "@/lib/offline/sync-processor";
import { SPEKIT } from "@/lib/spekit-targets";

export function PendingSyncBadge() {
  const [count, setCount] = useState(0);
  const [online, setOnline] = useState(isOnline);
  const [isPending, startTransition] = useTransition();

  const refreshCount = useCallback(async () => {
    setCount(await countPendingSubmissions());
  }, []);

  useEffect(() => {
    void refreshCount();
    const unsub = subscribeConnectivity(setOnline);

    const onSyncComplete = () => {
      void refreshCount();
    };

    window.addEventListener("offline-sync-complete", onSyncComplete);
    return () => {
      unsub();
      window.removeEventListener("offline-sync-complete", onSyncComplete);
    };
  }, [refreshCount]);

  if (count === 0) return null;

  const handleSync = () => {
    startTransition(async () => {
        await flushPendingSubmissions();
      await refreshCount();
    });
  };

  return (
    <div
      className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-teal-200 bg-teal-50 px-4 py-3 dark:border-teal-800/50 dark:bg-teal-950/40"
      role="status"
      data-spekit={SPEKIT.pendingSyncBadge}
    >
      <p className="text-sm font-bold text-teal-900 dark:text-teal-100">
        {count === 1
          ? "محاولة اختبار واحدة بانتظار المزامنة"
          : `${count} محاولات اختبار بانتظار المزامنة`}
      </p>
      {online && (
        <Button
          type="button"
          size="sm"
          variant="outline"
          className="h-10 gap-2 border-teal-300 bg-white font-bold text-teal-800 hover:bg-teal-100 dark:border-teal-700 dark:bg-slate-900 dark:text-teal-200 dark:hover:bg-slate-800"
          onClick={handleSync}
          disabled={isPending}
          data-spekit={SPEKIT.offlineSyncNow}
        >
          {isPending ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <CloudUpload className="size-4" />
          )}
          مزامنة الآن
        </Button>
      )}
    </div>
  );
}
