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
        "h-[52px] w-full min-w-0 rounded-xl border border-gray-200 bg-background px-4 py-2.5",
        "text-start text-base font-medium leading-normal text-foreground transition-all duration-200 outline-none touch-manipulation",
        "placeholder:text-muted-foreground/55 dark:placeholder:text-slate-400",
        "hover:border-gray-300 dark:border-slate-600 dark:bg-slate-900/70 dark:hover:border-slate-500",
        "focus:border-emerald-500 focus:bg-background dark:focus:border-emerald-500 dark:focus:bg-slate-950",
        "focus-visible:ring-2 focus-visible:ring-emerald-100 focus-visible:ring-offset-0 dark:focus-visible:ring-emerald-500/25",
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
