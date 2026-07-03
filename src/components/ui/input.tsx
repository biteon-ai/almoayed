import * as React from "react"
import { Input as InputPrimitive } from "@base-ui/react/input"

import { cn } from "@/lib/utils"

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <InputPrimitive
      type={type}
      data-slot="input"
      className={cn(
        /* text-base everywhere — prevents iOS Safari auto-zoom on focus */
        "h-[52px] w-full min-w-0 rounded-xl border border-input bg-muted/50 px-3.5 py-2",
        "text-base font-medium transition-all duration-200 outline-none touch-manipulation",
        "placeholder:text-muted-foreground/70",
        "hover:border-brand-300/70 focus:border-brand-500 focus:bg-background",
        "focus-visible:ring-[3px] focus-visible:ring-brand-500/15 focus-visible:ring-offset-0",
        "disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50",
        "file:inline-flex file:h-8 file:border-0 file:bg-transparent file:text-sm file:font-medium",
        "aria-invalid:border-destructive aria-invalid:ring-destructive/15",
        className
      )}
      {...props}
    />
  )
}

export { Input }
