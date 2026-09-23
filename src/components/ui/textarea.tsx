import * as React from "react";

import { cn } from "@/lib/utils";

function Textarea({
  className,
  ...props
}: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "flex min-h-[96px] w-full rounded-xl border border-gray-200 bg-background px-4 py-3",
        "text-start text-base font-medium leading-relaxed text-foreground transition-all duration-200 outline-none touch-manipulation",
        "placeholder:text-muted-foreground/55 dark:placeholder:text-slate-400",
        "hover:border-gray-300",
        "dark:border-slate-700 dark:bg-slate-900 dark:text-white dark:hover:border-slate-500",
        "focus:border-emerald-500 focus:bg-background dark:focus:border-emerald-500 dark:focus:bg-slate-950",
        "focus-visible:ring-2 focus-visible:ring-emerald-100 focus-visible:ring-offset-0 dark:focus-visible:ring-emerald-500/25",
        "disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50",
        "aria-invalid:border-destructive aria-invalid:ring-destructive/15",
        "resize-y",
        className
      )}
      {...props}
    />
  );
}

export { Textarea };
