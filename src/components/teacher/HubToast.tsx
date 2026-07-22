"use client";

import { useEffect } from "react";
import { cn } from "@/lib/utils";

interface HubToastProps {
  message: string | null;
  tone?: "success" | "error";
  onDismiss: () => void;
}

export function HubToast({
  message,
  tone = "success",
  onDismiss,
}: HubToastProps) {
  useEffect(() => {
    if (!message) return;
    const t = window.setTimeout(onDismiss, 3500);
    return () => window.clearTimeout(t);
  }, [message, onDismiss]);

  if (!message) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        "fixed bottom-20 start-4 end-4 z-50 mx-auto max-w-md rounded-xl border px-4 py-3 text-sm font-medium shadow-lg sm:bottom-6",
        tone === "success"
          ? "border-brand-200 bg-brand-50 text-brand-900"
          : "border-destructive/30 bg-destructive/10 text-destructive"
      )}
    >
      {message}
    </div>
  );
}
