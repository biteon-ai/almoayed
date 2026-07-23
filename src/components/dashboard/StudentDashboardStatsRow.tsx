"use client";

import type { DashboardStats } from "@/types/database";
import type { StudentGamification } from "@/lib/student-gamification";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
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
        <CardContent className="flex items-center justify-between p-5">
          <div className="space-y-1">
            <p className="text-xs font-medium text-muted-foreground">
              اختبارات مكتملة
            </p>
            <div className="flex items-baseline gap-2">
              <h3 className="text-3xl font-black text-foreground">
                {stats.completedQuizCount}
              </h3>
              {gamification.completedThisWeek > 0 && (
                <span className="flex items-center gap-0.5 text-xs font-bold text-emerald-600">
                  <CheckCircle2 className="h-3.5 w-3.5" />+
                  {gamification.completedThisWeek} هذا الأسبوع
                </span>
              )}
            </div>
          </div>
          <div className="rounded-2xl bg-emerald-500/10 p-3.5 text-emerald-600 transition-transform group-hover:scale-110">
            <BookOpen className="h-6 w-6" />
          </div>
        </CardContent>
      </Card>

      <Card className="group rounded-2xl border bg-card shadow-xs transition-all hover:border-teal-500/40">
        <CardContent className="flex items-center justify-between p-5">
          <div className="space-y-1">
            <p className="text-xs font-medium text-muted-foreground">
              المعدل العام
            </p>
            <div className="flex items-baseline gap-2">
              <h3 className="text-3xl font-black text-foreground">
                {stats.overallAverageScore}%
              </h3>
              {gamification.scoreTrendPercent !== null &&
                gamification.scoreTrendPercent !== 0 && (
                  <span
                    className={cn(
                      "flex items-center gap-0.5 text-xs font-bold",
                      gamification.scoreTrendPercent > 0
                        ? "text-emerald-600"
                        : "text-rose-600"
                    )}
                  >
                    <TrendingUp className="h-3.5 w-3.5" />
                    {gamification.scoreTrendPercent > 0 ? "+" : ""}
                    {gamification.scoreTrendPercent}%
                  </span>
                )}
            </div>
          </div>
          <div className="rounded-2xl bg-teal-500/10 p-3.5 text-teal-600 transition-transform group-hover:scale-110">
            <Target className="h-6 w-6" />
          </div>
        </CardContent>
      </Card>

      <Card className="group rounded-2xl border border-amber-200/70 bg-gradient-to-br from-amber-50/40 to-yellow-50/20 shadow-xs transition-all hover:border-amber-500/50 dark:border-amber-800/50 dark:from-amber-950/20 dark:to-background">
        <CardContent className="flex items-center justify-between p-5">
          <div className="space-y-1">
            <p className="text-xs font-semibold text-amber-800 dark:text-amber-300">
              مستوى الاشتراك
            </p>
            <h3 className="text-2xl font-black text-amber-900 dark:text-amber-200">
              {isPro ? "باقة Pro 👑" : "مجاني"}
            </h3>
          </div>
          <div className="rounded-2xl bg-amber-500/15 p-3.5 text-amber-600 transition-transform group-hover:rotate-12">
            <Crown className="h-6 w-6 fill-amber-500" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
