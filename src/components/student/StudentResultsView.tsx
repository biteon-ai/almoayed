"use client";

import type { ComponentType } from "react";
import { useMemo, useState } from "react";
import Link from "next/link";
import type { DashboardStats, RecentScoreRow } from "@/types/database";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  QUIZ_CATEGORY_FILTERS,
  type QuizCategoryFilter,
  filterQuizzesByCategory,
  filterQuizzesBySearch,
  getScoreGrade,
  gradePillClassName,
  scoreBadgeClassName,
} from "@/lib/student-quiz-ui";
import { SPEKIT } from "@/lib/spekit-targets";
import { cn } from "@/lib/utils";
import {
  BarChart3,
  BookOpen,
  CheckCircle2,
  RotateCcw,
  Search,
  Sparkles,
  Target,
  Eye,
} from "lucide-react";

interface StudentResultsViewProps {
  stats: DashboardStats;
  scores: RecentScoreRow[];
  totalQuizzes: number;
}

function formatSubmittedAt(iso: string): string {
  return new Intl.DateTimeFormat("ar-SY", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(iso));
}

export function StudentResultsView({
  stats,
  scores,
  totalQuizzes,
}: StudentResultsViewProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] =
    useState<QuizCategoryFilter>("الكل");

  const filteredScores = useMemo(() => {
    const byCategory = filterQuizzesByCategory(scores, selectedCategory);
    return filterQuizzesBySearch(byCategory, searchQuery);
  }, [scores, selectedCategory, searchQuery]);

  return (
    <div
      className="container mx-auto max-w-7xl space-y-8 p-4 sm:p-6"
      data-spekit={SPEKIT.studentResultsPage}
    >
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-teal-600 via-emerald-600 to-teal-800 p-6 text-white shadow-xl sm:p-8">
        <div className="relative z-10 flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
          <div className="space-y-1.5">
            <Badge className="rounded-full border-white/20 bg-white/15 px-3 py-1 text-xs text-white backdrop-blur-md">
              <Sparkles className="ml-1 h-3.5 w-3.5 text-amber-300" />
              سجل الإنجاز
            </Badge>
            <h1 className="text-2xl font-black sm:text-3xl">نتائجي</h1>
            <p className="text-xs text-emerald-100 sm:text-sm">
              تابع تطور أدائك، راجع إجاباتك، وأعد المحاولة لتحسين معدلك.
            </p>
          </div>

          <div className="grid grid-cols-3 gap-2 rounded-2xl border border-white/20 bg-white/10 p-3 backdrop-blur-md sm:gap-3 sm:p-3.5">
            <QuickStat icon={BookOpen} value={totalQuizzes} label="اختبار" />
            <QuickStat
              icon={CheckCircle2}
              value={stats.completedQuizCount}
              label="مكتمل"
            />
            <QuickStat
              icon={Target}
              value={`${stats.overallAverageScore}%`}
              label="الدقة"
            />
          </div>
        </div>
      </section>

      <div className="flex flex-col items-center justify-between gap-4 rounded-2xl border bg-card p-4 shadow-xs sm:flex-row">
        <div className="relative w-full sm:w-80">
          <Search className="absolute end-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="h-10 rounded-xl border-muted bg-muted/30 pe-10 text-xs focus-visible:ring-emerald-500"
            placeholder="ابحث في النتائج..."
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            aria-label="بحث في النتائج"
          />
        </div>

        <div className="flex w-full items-center gap-2 overflow-x-auto pb-1 sm:w-auto sm:pb-0">
          {QUIZ_CATEGORY_FILTERS.map((category) => (
            <Button
              key={category}
              type="button"
              size="sm"
              variant={selectedCategory === category ? "default" : "outline"}
              onClick={() => setSelectedCategory(category)}
              className={cn(
                "h-9 shrink-0 rounded-xl px-4 text-xs",
                selectedCategory === category &&
                  "bg-emerald-600 font-bold text-white hover:bg-emerald-700"
              )}
            >
              {category}
            </Button>
          ))}
        </div>
      </div>

      {scores.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed bg-muted/20 px-6 py-16 text-center">
          <BarChart3 className="mb-4 h-10 w-10 text-muted-foreground" />
          <p className="text-sm font-semibold">ما في نتائج بعد</p>
          <p className="mt-1 text-xs text-muted-foreground">
            حلّ أول اختبار وشوف نتيجتك هون!
          </p>
          <Link
            href="/quizzes"
            className={cn(
              buttonVariants({ size: "lg" }),
              "mt-5 rounded-xl bg-emerald-600 font-bold hover:bg-emerald-700"
            )}
          >
            ابدأ أول اختبار
          </Link>
        </div>
      ) : filteredScores.length === 0 ? (
        <div className="rounded-2xl border border-dashed bg-muted/20 px-6 py-10 text-center">
          <p className="text-sm font-semibold">ما في نتائج مطابقة لبحثك</p>
          <p className="mt-1 text-xs text-muted-foreground">
            جرّب كلمة مختلفة أو غيّر التصنيف.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {filteredScores.map((row) => (
            <ResultCard key={`${row.quizId}-${row.submittedAt}`} row={row} />
          ))}
        </div>
      )}
    </div>
  );
}

function ResultCard({ row }: { row: RecentScoreRow }) {
  const grade = getScoreGrade(row.score);

  return (
    <Card className="overflow-hidden rounded-2xl border bg-card shadow-xs transition-all hover:border-emerald-500/40 hover:shadow-md">
      <CardContent className="space-y-4 p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <Badge className="text-[11px]" variant="outline">
                {row.categoryName}
              </Badge>
              <Badge
                className={cn(
                  "border text-[11px] font-semibold",
                  gradePillClassName(grade.tone)
                )}
              >
                {grade.label} {grade.emoji}
              </Badge>
            </div>
            <h3 className="line-clamp-2 text-base font-bold text-foreground">
              {row.quizTitle}
            </h3>
            <p className="text-[11px] text-muted-foreground">
              {formatSubmittedAt(row.submittedAt)}
            </p>
          </div>

          <span
            className={cn(
              "shrink-0 rounded-xl border px-3 py-1.5 text-lg font-black tabular-nums",
              scoreBadgeClassName(grade.tone)
            )}
          >
            {row.score}%
          </span>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row">
          <Link
            href={`/quiz/${row.quizId}`}
            className={cn(
              buttonVariants({ variant: "outline", size: "lg" }),
              "h-10 flex-1 gap-1.5 rounded-xl border-emerald-200 text-xs font-bold text-emerald-700 hover:bg-emerald-50"
            )}
          >
            <RotateCcw className="h-4 w-4" />
            إعادة المحاولة
          </Link>
          <Link
            href={`/quiz/${row.quizId}`}
            className={cn(
              buttonVariants({ size: "lg" }),
              "h-10 flex-1 gap-1.5 rounded-xl bg-emerald-600 text-xs font-bold text-white hover:bg-emerald-700"
            )}
          >
            <Eye className="h-4 w-4" />
            مراجعة الإجابات
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}

function QuickStat({
  icon: Icon,
  value,
  label,
}: {
  icon: ComponentType<{ className?: string }>;
  value: string | number;
  label: string;
}) {
  return (
    <div className="min-w-[72px] text-center">
      <Icon className="mx-auto mb-1 h-4 w-4 text-amber-300" />
      <div className="text-lg font-black leading-none">{value}</div>
      <p className="mt-1 text-[10px] font-medium text-emerald-100">{label}</p>
    </div>
  );
}
