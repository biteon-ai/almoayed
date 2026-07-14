import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function SettingsSection({
  id,
  className,
  children,
}: {
  id: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <section
      id={id}
      className={cn("scroll-mt-28 md:scroll-mt-24", className)}
      aria-labelledby={`${id}-heading`}
    >
      {children}
    </section>
  );
}
