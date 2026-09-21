"use client";

import type { DashboardStats } from "@/types/database";
import type { StudentGamification } from "@/lib/student-gamification";
import { Card, CardContent } from "@/components/ui/card";
import { PercentText } from "@/components/ui/rtl-num";
import { cn } from "@/lib/utils";
import { statIconBadgeClass } from "@/lib/ui-chrome";
import {
  BookOpen,
  CheckCircle2,
  Crown,
  Target,
  TrendingUp,
} from "lucide-react";

export interface StudentDashboardStatsRowProps {
  stats: DashboardStats;
  gamification: StudentGamification;
}

/**
 * Three KPI cards: completed quizzes, average score, and subscription tier.
 */
export function StudentDashboardStatsRow({
  stats,
  gamification,
}: StudentDashboardStatsRowProps) {
  const isPro = stats.tier === "pro";

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
      <Card className="group rounded-2xl border bg-card shadow-xs transition-all hover:border-emerald-500/40">
        <CardContent className="flex items-center justify-between gap-4 p-6">
          <div className="min-w-0 space-y-1.5 text-start">
            <p className="text-xs font-medium text-muted-foreground">
              اختبارات مكتملة
            </p>
            <div className="flex flex-wrap items-baseline gap-2">
              <h3 className="text-3xl font-black tabular-nums text-foreground">
                {stats.completedQuizCount}
              </h3>
              {gamification.completedThisWeek > 0 && (
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-200">
                  <CheckCircle2 className="size-3.5" />+
                  {gamification.completedThisWeek} هذا الأسبوع
                </span>
              )}
            </div>
          </div>
          <div
            className={cn(
              statIconBadgeClass,
              "transition-transform group-hover:scale-105"
            )}
          >
            <BookOpen className="size-5" />
          </div>
        </CardContent>
      </Card>

      <Card className="group rounded-2xl border bg-card shadow-xs transition-all hover:border-teal-500/40">
        <CardContent className="flex items-center justify-between gap-4 p-6">
          <div className="min-w-0 space-y-1.5 text-start">
            <p className="text-xs font-medium text-muted-foreground">
              المعدل العام
            </p>
            <div className="flex flex-wrap items-baseline gap-2">
              <h3 className="text-3xl font-black text-foreground">
                <PercentText value={stats.overallAverageScore} />
              </h3>
              {gamification.scoreTrendPercent !== null &&
                gamification.scoreTrendPercent !== 0 && (
                  <span
                    className={cn(
                      "inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium",
                      gamification.scoreTrendPercent > 0
                        ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-200"
                        : "bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-200"
                    )}
                  >
                    <TrendingUp className="size-3.5" />
                    {gamification.scoreTrendPercent > 0 ? "+" : ""}
                    <PercentText value={Math.abs(gamification.scoreTrendPercent)} />
                  </span>
                )}
            </div>
          </div>
          <div
            className={cn(
              statIconBadgeClass,
              "bg-teal-50 text-teal-600 dark:bg-teal-950/40 dark:text-teal-300",
              "transition-transform group-hover:scale-105"
            )}
          >
            <Target className="size-5" />
          </div>
        </CardContent>
      </Card>

      <Card className="group rounded-2xl border border-amber-200/70 bg-gradient-to-br from-amber-50/40 to-yellow-50/20 shadow-xs transition-all hover:border-amber-500/50 dark:border-amber-800/50 dark:from-amber-950/20 dark:to-background">
        <CardContent className="flex items-center justify-between gap-4 p-6">
          <div className="min-w-0 space-y-1.5 text-start">
            <p className="text-xs font-semibold text-amber-800 dark:text-amber-300">
              مستوى الاشتراك
            </p>
            <h3 className="text-2xl font-black text-amber-900 dark:text-amber-200">
              {isPro ? "باقة Pro 👑" : "مجاني"}
            </h3>
          </div>
          <div
            className={cn(
              statIconBadgeClass,
              "bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-300",
              "transition-transform group-hover:rotate-6"
            )}
          >
            <Crown className="size-5 fill-amber-500" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
