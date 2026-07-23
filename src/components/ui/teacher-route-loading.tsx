import { Loader2 } from "lucide-react";

interface TeacherRouteLoadingProps {
  message?: string;
  subMessage?: string;
}

export function TeacherRouteLoading({
  message = "جاري التحميل…",
  subMessage = "يرجى الانتظار",
}: TeacherRouteLoadingProps) {
  return (
    <div
      className="flex min-h-[50vh] flex-col items-center justify-center py-16"
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <Loader2
        className="size-8 animate-spin text-brand-600 dark:text-brand-400"
        aria-hidden
      />
      <p className="mt-4 text-sm font-bold text-foreground">{message}</p>
      <p className="mt-1 text-xs text-muted-foreground">{subMessage}</p>
    </div>
  );
}
