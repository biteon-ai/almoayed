"use client";

import { Tabs as TabsPrimitive } from "@base-ui/react/tabs";
import { cn } from "@/lib/utils";

function Tabs({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Root>) {
  return (
    <TabsPrimitive.Root
      className={cn("flex w-full flex-col gap-4", className)}
      {...props}
    />
  );
}

function TabsList({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.List>) {
  return (
    <TabsPrimitive.List
      className={cn(
        "flex h-11 w-full items-center gap-1 rounded-2xl border border-slate-100 bg-slate-100/80 p-1 shadow-inner",
        "dark:border-slate-700 dark:bg-slate-800/90 dark:shadow-none",
        className
      )}
      {...props}
    />
  );
}

function TabsTrigger({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Tab>) {
  return (
    <TabsPrimitive.Tab
      className={cn(
        "flex h-9 min-w-0 flex-1 items-center justify-center rounded-xl px-3 text-center text-xs font-bold transition-all duration-200",
        "text-slate-500 hover:text-slate-700 dark:text-slate-300 dark:hover:text-white",
        "data-[active]:bg-white data-[active]:text-slate-800 data-[active]:shadow-sm",
        "dark:data-[active]:bg-slate-900 dark:data-[active]:text-white dark:data-[active]:shadow-md dark:data-[active]:ring-1 dark:data-[active]:ring-slate-600",
        "data-disabled:pointer-events-none data-disabled:opacity-45 data-disabled:hover:text-slate-500",
        className
      )}
      {...props}
    />
  );
}

function TabsContent({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Panel>) {
  return (
    <TabsPrimitive.Panel
      className={cn("focus-visible:outline-none", className)}
      {...props}
    />
  );
}

export { Tabs, TabsList, TabsTrigger, TabsContent };
