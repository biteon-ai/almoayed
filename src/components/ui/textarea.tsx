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
        "flex min-h-[96px] w-full rounded-xl border border-input bg-muted/50 px-3.5 py-3",
        "text-base font-medium transition-all duration-200 outline-none touch-manipulation",
        "placeholder:text-muted-foreground/70",
        "hover:border-brand-300/70 focus:border-brand-500 focus:bg-background",
        "focus-visible:ring-[3px] focus-visible:ring-brand-500/15 focus-visible:ring-offset-0",
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
