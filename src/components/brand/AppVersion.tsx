import { APP_VERSION } from "@/lib/constants";
import { SPEKIT, spekit } from "@/lib/spekit-targets";
import { cn } from "@/lib/utils";

/** Subtle published-version label, e.g. v0.1.0. Reads from package.json via APP_VERSION. */
export function AppVersion({ className }: { className?: string }) {
  return (
    <span
      {...spekit(SPEKIT.appVersion)}
      className={cn(
        "text-xs text-slate-400 tabular-nums dark:text-slate-500",
        className
      )}
      dir="ltr"
    >
      {`v${APP_VERSION}`}
    </span>
  );
}
