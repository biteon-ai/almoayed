"use client";

import { WifiOff } from "lucide-react";
import { SPEKIT } from "@/lib/spekit-targets";

export function OfflineStatusBanner() {
  return (
    <div
      className="mb-4 flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900"
      role="status"
      data-spekit={SPEKIT.offlineStatusBanner}
    >
      <WifiOff className="mt-0.5 size-4 shrink-0" aria-hidden />
      <p className="font-bold leading-relaxed">
        أنت غير متصل بالإنترنت — إجاباتك تُحفظ على هذا الجهاز وستُرسل عند
        عودة الاتصال.
      </p>
    </div>
  );
}
