import { cn } from "@/lib/utils";

interface MobileShellProps {
  children: React.ReactNode;
  className?: string;
  /** Disable default horizontal padding (e.g. full-bleed headers) */
  noPadding?: boolean;
}

/**
 * PWA-native page shell: centered max-width, safe-area insets, overscroll containment.
 */
export function MobileShell({
  children,
  className,
  noPadding = false,
}: MobileShellProps) {
  return (
    <div
      className={cn(
        "mobile-shell relative flex min-h-dvh w-full max-w-md flex-col overscroll-y-contain mx-auto",
        "pt-[max(0.75rem,env(safe-area-inset-top))]",
        "pb-[max(0.75rem,env(safe-area-inset-bottom))]",
        !noPadding && "px-4",
        className
      )}
    >
      {children}
    </div>
  );
}

interface StickyBottomBarProps {
  children: React.ReactNode;
  className?: string;
}

/** Anchored action row above home indicator / safe area */
export function StickyBottomBar({ children, className }: StickyBottomBarProps) {
  return (
    <div
      className={cn(
        "sticky bottom-0 z-30 -mx-4 mt-auto border-t border-border/60",
        "bg-background/80 px-4 pt-3 backdrop-blur-xl backdrop-saturate-150",
        "pb-[max(0.75rem,env(safe-area-inset-bottom))]",
        "supports-[backdrop-filter]:bg-background/70",
        className
      )}
    >
      {children}
    </div>
  );
}
