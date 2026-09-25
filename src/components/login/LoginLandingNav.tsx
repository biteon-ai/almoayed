"use client";

import Link from "next/link";
import { Home } from "lucide-react";
import { usePwaInstall } from "@/hooks/use-pwa-install";
import { cn } from "@/lib/utils";
import { SPEKIT, spekit, type SpekitTarget } from "@/lib/spekit-targets";

const LANDING_BACK_LABEL = "العودة للصفحة الرئيسية";

/**
 * UI-010 / UI-022: In a normal browser tab, brand mark links home.
 * Installed PWA keeps a static mark so login stays the clean root.
 */
export function LoginBrandHomeLink({
  children,
  className,
  ringOffsetClassName = "focus-visible:ring-offset-emerald-700",
}: {
  children: React.ReactNode;
  className?: string;
  ringOffsetClassName?: string;
}) {
  const { installed, ready } = usePwaInstall();
  const linkHome = ready && !installed;

  if (!linkHome) {
    return <div className={className}>{children}</div>;
  }

  return (
    <Link
      href="/"
      className={cn(
        "rounded-xl transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50 focus-visible:ring-offset-2",
        ringOffsetClassName,
        className
      )}
      aria-label={LANDING_BACK_LABEL}
    >
      {children}
    </Link>
  );
}

/**
 * Icon-only header control back to `/` — browser tabs only.
 * Installed PWA (`display-mode: standalone` or iOS `navigator.standalone`) renders nothing.
 */
export function LoginLandingBackLink({
  className,
  spekitId = SPEKIT.loginLandingBack,
  ringOffsetClassName = "focus-visible:ring-offset-emerald-700",
}: {
  className?: string;
  spekitId?: SpekitTarget;
  ringOffsetClassName?: string;
}) {
  const { installed, ready } = usePwaInstall();
  const showInBrowser = ready && !installed;

  if (!showInBrowser) return null;

  return (
    <Link
      href="/"
      aria-label={LANDING_BACK_LABEL}
      title={LANDING_BACK_LABEL}
      className={cn(
        "inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-white/20 bg-white/10 text-white shadow-none backdrop-blur-sm",
        "transition-[background-color,border-color,transform,box-shadow] duration-200 ease-out",
        "hover:border-white/40 hover:bg-white/20 hover:shadow-sm active:scale-95",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60 focus-visible:ring-offset-2",
        ringOffsetClassName,
        className
      )}
      {...spekit(spekitId)}
    >
      <Home className="size-4" aria-hidden />
    </Link>
  );
}
