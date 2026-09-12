"use client";

import { useEffect } from "react";
import { CheckCircle2, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface HubToastProps {
  message: string | null;
  tone?: "success" | "error";
  onDismiss: () => void;
  /** Auto-hide delay in ms (default 2500). */
  durationMs?: number;
}

export function HubToast({
  message,
  tone = "success",
  onDismiss,
  durationMs = 2500,
}: HubToastProps) {
  useEffect(() => {
    if (!message) return;
    const t = window.setTimeout(onDismiss, durationMs);
    return () => window.clearTimeout(t);
  }, [message, onDismiss, durationMs]);

  if (!message) return null;

  const Icon = tone === "success" ? CheckCircle2 : XCircle;

  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        // Above dialogs (z-50); start-4 = bottom-right in RTL
        "pointer-events-none fixed bottom-6 start-4 z-[200] max-w-sm animate-fade-in",
        "rounded-lg px-4 py-3 text-sm font-medium shadow-lg",
        "flex items-center gap-2.5",
        tone === "success"
          ? "bg-emerald-600 text-white"
          : "border border-destructive/30 bg-destructive text-destructive-foreground"
      )}
    >
      <Icon className="size-4 shrink-0 opacity-95" aria-hidden />
      <span>{message}</span>
    </div>
  );
}
