import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
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
      <CardContent className="p-6">
        <div className="flex items-center justify-between gap-3 text-muted-foreground">
          <span className="text-sm font-medium leading-none">{label}</span>
          <Icon className="size-5 shrink-0 opacity-70" aria-hidden />
        </div>
        <p
          className={cn(
            "mt-2 text-3xl font-bold tracking-tight text-foreground tabular-nums",
            valueClassName
          )}
        >
          {value}
        </p>
      </CardContent>
    </Card>
  );
}
