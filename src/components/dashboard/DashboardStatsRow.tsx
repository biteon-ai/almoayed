import type { DashboardStats } from "@/types/database";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Crown, ClipboardCheck, TrendingUp } from "lucide-react";

interface DashboardStatsRowProps {
  stats: DashboardStats;
  /** horizontal: compact 3-col row (mobile). vertical: stacked sidebar (desktop). */
  variant?: "horizontal" | "vertical";
  className?: string;
}

function StatCard({
  icon: Icon,
  label,
  value,
  compact,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: React.ReactNode;
  compact?: boolean;
}) {
  return (
    <div
      className={cn(
        "flex min-w-0 flex-col rounded-2xl border border-slate-100 bg-white shadow-sm",
        "transition-shadow duration-200 hover:shadow-md",
        compact ? "gap-1 px-2.5 py-2.5" : "gap-2 p-5"
      )}
    >
      <div className="flex items-center gap-2 text-slate-500">
        <div
          className={cn(
            "flex shrink-0 items-center justify-center rounded-lg bg-brand-50",
            compact ? "size-7" : "size-9"
          )}
        >
          <Icon
            className={cn(
              "text-brand-600",
              compact ? "size-3.5" : "size-4"
            )}
          />
        </div>
        <span
          className={cn(
            "font-bold leading-tight text-slate-600",
            compact ? "text-[10px]" : "text-xs"
          )}
        >
          {label}
        </span>
      </div>
      <div
        className={cn(
          "font-black tabular-nums text-slate-800",
          compact ? "text-base" : "text-2xl"
        )}
      >
        {value}
      </div>
    </div>
  );
}

export function DashboardStatsRow({
  stats,
  variant = "horizontal",
  className,
}: DashboardStatsRowProps) {
  const isPro = stats.tier === "pro";
  const compact = variant === "horizontal";

  const tierValue = (
    <Badge
      variant={isPro ? "default" : "secondary"}
      className={cn(
        "font-bold",
        compact ? "text-[10px]" : "text-xs",
        isPro && "bg-brand-600 hover:bg-brand-600"
      )}
    >
      {isPro ? "Pro" : "Free"}
    </Badge>
  );

  return (
    <div
      className={cn(
        variant === "horizontal"
          ? "grid grid-cols-3 gap-3"
          : "flex flex-col gap-4",
        className
      )}
    >
      <StatCard icon={Crown} label="الاشتراك" value={tierValue} compact={compact} />
      <StatCard
        icon={ClipboardCheck}
        label="اختبارات مكتملة"
        value={stats.completedQuizCount}
        compact={compact}
      />
      <StatCard
        icon={TrendingUp}
        label="المعدل العام"
        value={`${stats.overallAverageScore}%`}
        compact={compact}
      />
    </div>
  );
}
