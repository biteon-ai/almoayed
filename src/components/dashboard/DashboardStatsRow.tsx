import type { DashboardStats } from "@/types/database";
import { Badge } from "@/components/ui/badge";
import { PercentText } from "@/components/ui/rtl-num";
import { cn } from "@/lib/utils";
import { statIconBadgeClass } from "@/lib/ui-chrome";
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
        "flex min-w-0 items-center justify-between gap-3 rounded-2xl border border-slate-100 bg-white shadow-sm",
        "dark:border-slate-700 dark:bg-slate-900 dark:shadow-none",
        "transition-shadow duration-200 hover:shadow-md dark:hover:shadow-none",
        compact ? "px-3 py-3" : "p-6"
      )}
    >
      <div className="min-w-0 space-y-1 text-start">
        <span
          className={cn(
            "block font-bold leading-tight text-slate-600 dark:text-slate-300",
            compact ? "text-[10px]" : "text-xs"
          )}
        >
          {label}
        </span>
        <div
          className={cn(
            "font-black tabular-nums text-slate-800 dark:text-white",
            compact ? "text-base" : "text-2xl"
          )}
        >
          {value}
        </div>
      </div>
      <div
        className={cn(
          statIconBadgeClass,
          compact && "size-9 rounded-lg p-2"
        )}
      >
        <Icon className={cn(compact ? "size-3.5" : "size-5")} />
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
        "rounded-full px-3 py-1 font-medium",
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
        value={<PercentText value={stats.overallAverageScore} />}
        compact={compact}
      />
    </div>
  );
}
