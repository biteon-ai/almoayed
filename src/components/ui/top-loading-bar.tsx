"use client";

interface TopLoadingBarProps {
  isLoading: boolean;
}

export function TopLoadingBar({ isLoading }: TopLoadingBarProps) {
  if (!isLoading) return null;

  return (
    <div
      className="pointer-events-none fixed inset-x-0 top-0 z-[9999] h-1 overflow-hidden bg-emerald-100/30 dark:bg-emerald-950/30"
      role="progressbar"
      aria-hidden
    >
      <div className="h-full w-full animate-top-loading-bar bg-gradient-to-r from-emerald-500 via-teal-400 to-amber-400 shadow-[0_0_10px_#10b981]" />
    </div>
  );
}
