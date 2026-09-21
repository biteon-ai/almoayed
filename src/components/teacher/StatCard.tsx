import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { statIconBadgeClass } from "@/lib/ui-chrome";
import type { SpekitTarget } from "@/lib/spekit-targets";
import type { LucideIcon } from "lucide-react";

interface StatCardProps {
  label: string;
  value: number | string;
  icon: LucideIcon;
  valueClassName?: string;
  spekitId?: SpekitTarget;
}

export function StatCard({
  label,
  value,
  icon: Icon,
  valueClassName,
  spekitId,
}: StatCardProps) {
  return (
    <Card
      className="overflow-hidden border-border/70 shadow-sm"
      {...(spekitId ? { "data-spekit": spekitId } : {})}
    >
      <CardContent className="flex items-center justify-between gap-4 p-6">
        <div className="min-w-0 space-y-1.5 text-start">
          <p className="text-sm font-medium leading-none text-muted-foreground">
            {label}
          </p>
          <p
            className={cn(
              "text-3xl font-bold tracking-tight text-foreground tabular-nums",
              valueClassName
            )}
          >
            {value}
          </p>
        </div>
        <div className={statIconBadgeClass} aria-hidden>
          <Icon className="size-5" />
        </div>
      </CardContent>
    </Card>
  );
}
