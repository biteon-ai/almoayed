import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const baseClass =
  "rounded-full border px-2.5 py-0.5 text-xs font-semibold shadow-none";

export const statusBadgeStyles = {
  active: "border-emerald-200 bg-emerald-50 text-emerald-700",
  hidden: "border-border bg-muted/40 text-muted-foreground",
  pro: "border-amber-200 bg-amber-50 text-amber-700",
  free: "border-slate-200 bg-slate-50 text-slate-600",
  regular: "border-slate-200 bg-slate-50 text-slate-700",
  group: "border-slate-200 bg-slate-50 text-slate-700",
  pending: "border-amber-200 bg-amber-50 text-amber-700",
  deactivated: "border-slate-200 bg-slate-100 text-slate-500",
  upgrade: "border-amber-300 bg-amber-100 text-amber-800",
} as const;

export type StatusBadgeTone = keyof typeof statusBadgeStyles;

interface StatusBadgeProps {
  tone: StatusBadgeTone;
  children: React.ReactNode;
  className?: string;
}

export function StatusBadge({ tone, children, className }: StatusBadgeProps) {
  return (
    <Badge
      variant="outline"
      className={cn(baseClass, statusBadgeStyles[tone], className)}
    >
      {children}
    </Badge>
  );
}
