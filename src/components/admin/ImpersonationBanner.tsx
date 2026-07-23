"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { SPEKIT, spekit } from "@/lib/spekit-targets";
import { Loader2, LogOut } from "lucide-react";

interface ImpersonationBannerProps {
  teacherName: string;
}

export function ImpersonationBanner({ teacherName }: ImpersonationBannerProps) {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function exitImpersonation() {
    setPending(true);
    try {
      const res = await fetch("/api/admin/impersonate/exit", { method: "POST" });
      const data = (await res.json()) as { redirectTo?: string };
      router.push(data.redirectTo ?? "/admin/teachers");
      router.refresh();
    } finally {
      setPending(false);
    }
  }

  return (
    <button
      type="button"
      onClick={() => void exitImpersonation()}
      disabled={pending}
      className="sticky top-0 z-50 flex w-full items-center justify-center gap-2 border-b border-amber-300/60 bg-amber-100 px-4 py-3 text-center text-xs font-bold text-amber-950 shadow-sm dark:border-amber-700/50 dark:bg-amber-950/90 dark:text-amber-100"
      {...spekit(SPEKIT.adminImpersonationBanner)}
    >
      {pending ? <Loader2 className="size-4 animate-spin" /> : <LogOut className="size-4" />}
      <span>
        تسجيل الدخول بصفتك المدرس: {teacherName} — انقر هنا للعودة للوحة الأدمن
      </span>
    </button>
  );
}
