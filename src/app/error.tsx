"use client";

import { useEffect } from "react";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button-variants";
import { cn } from "@/lib/utils";
import { Home, RefreshCw } from "lucide-react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") {
      console.error("[app/error]", error);
    }
  }, [error]);

  return (
    <div
      dir="rtl"
      className="flex min-h-[60vh] flex-col items-center justify-center gap-4 bg-background px-6 py-16 text-center dark:bg-slate-950 dark:text-white"
      role="alert"
      data-app-error-boundary="route"
    >
      <p className="text-sm font-extrabold text-foreground dark:text-white">
        تعذّر عرض هذه الصفحة
      </p>
      <p className="max-w-sm text-xs leading-relaxed text-muted-foreground dark:text-slate-300">
        حدث خطأ أثناء التحميل. يمكنك المحاولة من جديد أو العودة للرئيسية.
      </p>
      <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
        <button
          type="button"
          onClick={reset}
          className={cn(
            buttonVariants({ size: "default" }),
            "h-11 gap-2 rounded-xl font-bold"
          )}
        >
          <RefreshCw className="size-4" aria-hidden />
          إعادة المحاولة
        </button>
        <Link
          href="/dashboard"
          className={cn(
            buttonVariants({ variant: "outline", size: "default" }),
            "h-11 gap-2 rounded-xl font-bold"
          )}
        >
          <Home className="size-4" aria-hidden />
          الرئيسية
        </Link>
      </div>
    </div>
  );
}
