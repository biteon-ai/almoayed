"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { SPEKIT } from "@/lib/spekit-targets";
import type { TeacherQuiz } from "@/types/database";
import { BookOpen, Crown, Sparkles } from "lucide-react";

interface QuizMetricsKPIHeaderProps {
  quizzes?: TeacherQuiz[];
  /** Full catalog size when quizzes is a server page slice. */
  catalogTotal?: number;
}

export function QuizMetricsKPIHeader({
  quizzes = [],
  catalogTotal,
}: QuizMetricsKPIHeaderProps) {
  const totalQuizzes = catalogTotal ?? quizzes.length;
  const proQuizzes = quizzes.filter((q) => !q.is_free).length;
  const freeQuizzes = totalQuizzes - proQuizzes;

  const proPercentage =
    totalQuizzes > 0 ? Math.round((proQuizzes / totalQuizzes) * 100) : 0;
  const freePercentage =
    totalQuizzes > 0 ? Math.round((freeQuizzes / totalQuizzes) * 100) : 0;

  return (
    <div
      className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3"
      dir="rtl"
      data-spekit={SPEKIT.teacherQuizKpis}
    >
      <Card className="rounded-2xl border bg-card shadow-xs transition-all hover:border-emerald-500/30">
        <CardContent className="flex items-center justify-between p-4">
          <div className="space-y-1">
            <p className="text-xs font-medium text-muted-foreground">
              إجمالي الاختبارات
            </p>
            <div className="flex items-baseline gap-2">
              <h3 className="text-2xl font-black text-foreground">
                {totalQuizzes}
              </h3>
              <span className="text-xs text-muted-foreground">اختبار</span>
            </div>
          </div>
          <div className="rounded-2xl bg-emerald-500/10 p-3 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400">
            <BookOpen className="size-5" />
          </div>
        </CardContent>
      </Card>

      <Card className="rounded-2xl border border-amber-200/60 bg-amber-50/20 shadow-xs transition-all hover:border-amber-500/50 dark:border-amber-800/40 dark:bg-amber-950/10">
        <CardContent className="flex items-center justify-between p-4">
          <div className="space-y-1">
            <div className="flex items-center gap-1.5">
              <p className="text-xs font-bold text-amber-800 dark:text-amber-300">
                اختبارات Pro
              </p>
              <Badge
                className="h-4 bg-amber-500/15 px-1.5 py-0 text-[10px] text-amber-700 dark:text-amber-300"
                variant="secondary"
              >
                👑 مدفوع
              </Badge>
            </div>
            <div className="flex items-baseline gap-2">
              <h3 className="text-2xl font-black text-amber-900 dark:text-amber-200">
                {proQuizzes}
              </h3>
              <span className="text-xs font-semibold text-amber-600 dark:text-amber-400">
                ({proPercentage}%)
              </span>
            </div>
          </div>
          <div className="rounded-2xl bg-amber-500/15 p-3 text-amber-600 dark:text-amber-400">
            <Crown className="size-5 fill-amber-500/30" />
          </div>
        </CardContent>
      </Card>

      <Card className="rounded-2xl border bg-card shadow-xs transition-all hover:border-slate-300">
        <CardContent className="flex items-center justify-between p-4">
          <div className="space-y-1">
            <div className="flex items-center gap-1.5">
              <p className="text-xs font-medium text-muted-foreground">
                اختبارات مجانية
              </p>
              <Badge className="h-4 px-1.5 py-0 text-[10px]" variant="outline">
                مجاني
              </Badge>
            </div>
            <div className="flex items-baseline gap-2">
              <h3 className="text-2xl font-black text-foreground">
                {freeQuizzes}
              </h3>
              <span className="text-xs font-semibold text-muted-foreground">
                ({freePercentage}%)
              </span>
            </div>
          </div>
          <div className="rounded-2xl bg-slate-100 p-3 text-slate-600 dark:bg-slate-800 dark:text-slate-300">
            <Sparkles className="size-5" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
