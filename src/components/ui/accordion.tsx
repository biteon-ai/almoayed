"use client";

import type * as React from "react";
import { Accordion as AccordionPrimitive } from "@base-ui/react/accordion";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

function Accordion({
  className,
  ...props
}: React.ComponentProps<typeof AccordionPrimitive.Root>) {
  return (
    <AccordionPrimitive.Root
      className={cn("w-full space-y-2", className)}
      {...props}
    />
  );
}

function AccordionItem({
  className,
  ...props
}: React.ComponentProps<typeof AccordionPrimitive.Item>) {
  return (
    <AccordionPrimitive.Item
      className={cn(
        "overflow-hidden rounded-2xl border border-border/70 bg-card shadow-sm",
        className
      )}
      {...props}
    />
  );
}

function AccordionTrigger({
  className,
  children,
  ...props
}: React.ComponentProps<typeof AccordionPrimitive.Trigger>) {
  return (
    <AccordionPrimitive.Header className="flex">
      <AccordionPrimitive.Trigger
        className={cn(
          "group flex flex-1 items-center justify-between gap-3 px-4 py-3.5 text-start text-sm font-semibold transition-colors",
          "hover:bg-muted/30 focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-brand-500/20",
          "disabled:pointer-events-none disabled:opacity-50",
          className
        )}
        {...props}
      >
        <span className="flex min-w-0 items-center gap-2">{children}</span>
        <ChevronDown
          className="size-4 shrink-0 text-muted-foreground transition-transform duration-200 group-data-[panel-open]:rotate-180"
          aria-hidden
        />
      </AccordionPrimitive.Trigger>
    </AccordionPrimitive.Header>
  );
}

function AccordionContent({
  className,
  children,
  ...props
}: React.ComponentProps<typeof AccordionPrimitive.Panel>) {
  return (
    <AccordionPrimitive.Panel
      className={cn("overflow-hidden border-t border-border/60 text-sm", className)}
      {...props}
    >
      <div className="px-4 py-4">{children}</div>
    </AccordionPrimitive.Panel>
  );
}

export { Accordion, AccordionItem, AccordionTrigger, AccordionContent };
