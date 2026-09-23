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
        "h-[52px] w-full min-w-0 rounded-xl border border-input bg-background px-4 py-2.5",
        "text-start text-base font-medium leading-normal text-foreground transition-all duration-200 outline-none touch-manipulation",
        "placeholder:text-muted-foreground",
        "hover:border-brand-300/70 dark:border-slate-600 dark:bg-slate-900/70 dark:hover:border-slate-500",
        "focus:border-emerald-500 focus:bg-background dark:focus:bg-slate-900",
        "focus-visible:ring-2 focus-visible:ring-emerald-500/25 focus-visible:ring-offset-0 dark:focus-visible:ring-emerald-400/30",
        "disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50",
        "file:inline-flex file:h-8 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground",
        "aria-invalid:border-destructive aria-invalid:ring-destructive/15",
        className
      )}
      {...props}
    />
  )
}

export { Input }
