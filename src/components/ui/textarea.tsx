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
        "text-start text-base font-medium leading-relaxed transition-all duration-200 outline-none touch-manipulation",
        "placeholder:text-muted-foreground/55",
        "hover:border-gray-300 dark:border-border dark:hover:border-border",
        "focus:border-emerald-500 focus:bg-background",
        "focus-visible:ring-2 focus-visible:ring-emerald-100 focus-visible:ring-offset-0",
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
