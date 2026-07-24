"use client";

import { Switch as SwitchParts } from "@base-ui/react/switch";
import { cn } from "@/lib/utils";

function Switch({ className, ...props }: SwitchParts.Root.Props) {
  return (
    <SwitchParts.Root
      data-slot="switch"
      className={cn(
        "peer inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border border-transparent shadow-xs transition-colors outline-none",
        "focus-visible:ring-[3px] focus-visible:ring-brand-500/20 focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        "disabled:cursor-not-allowed disabled:opacity-50",
        "data-[checked]:bg-brand-600 data-[unchecked]:bg-input dark:data-[unchecked]:bg-input/80",
        className
      )}
      {...props}
    >
      <SwitchParts.Thumb
        data-slot="switch-thumb"
        className={cn(
          "pointer-events-none block size-5 rounded-full bg-background shadow-sm ring-0 transition-transform",
          "data-[checked]:translate-x-5 data-[unchecked]:translate-x-0.5",
          "rtl:data-[checked]:-translate-x-5 rtl:data-[unchecked]:translate-x-[-0.125rem]"
        )}
      />
    </SwitchParts.Root>
  );
}

export { Switch };
