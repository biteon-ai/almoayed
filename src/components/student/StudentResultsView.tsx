"use client";

import type { ComponentType } from "react";
import { useMemo, useRef, useState } from "react";
import Link from "next/link";
import type { DashboardStats, RecentScoreRow } from "@/types/database";
import type { TeacherGamificationStatus } from "@/lib/teacher-gamification";
import { PaginationControls } from "@/components/ui/pagination-controls";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { buttonVariants } from "@/components/ui/button-variants";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { LevelProgressCard } from "@/components/dashboard/LevelProgressCard";
import { usePagination } from "@/hooks/usePagination";
import {
  QUIZ_CATEGORY_FILTERS,
  STUDENT_RESULTS_PAGE_SIZE,
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
  Calendar,
  CheckCircle2,
  Clock,
  Eye,
  RotateCcw,
  Search,
  Sparkles,
  Target,
} from "lucide-react";

interface StudentResultsViewProps {
  stats: DashboardStats;
  scores: RecentScoreRow[];
  totalQuizzes: number;
  teacherGamification: TeacherGamificationStatus | null;
}

function formatSubmittedDate(iso: string): string {
  return new Intl.DateTimeFormat("ar", {
    year: "numeric",
    month: "long",
    day: "numeric",
    numberingSystem: "latn",
  }).format(new Date(iso));
}

function formatSubmittedTime(iso: string): string {
  return new Intl.DateTimeFormat("ar", {
    hour: "2-digit",
    minute: "2-digit",
    numberingSystem: "latn",
  }).format(new Date(iso));
}

export function StudentResultsView({
  stats,
  scores,
  totalQuizzes,
  teacherGamification,
}: StudentResultsViewProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] =
    useState<QuizCategoryFilter>("الكل");
  const resultsSectionRef = useRef<HTMLElement>(null);

  const filteredScores = useMemo(() => {
    const byCategory = filterQuizzesByCategory(scores, selectedCategory);
    return filterQuizzesBySearch(byCategory, searchQuery);
  }, [scores, selectedCategory, searchQuery]);

  const {
    items: paginatedScores,
    page,
    totalPages,
    total: filteredTotal,
    setPage,
    resetPage,
  } = usePagination(filteredScores, STUDENT_RESULTS_PAGE_SIZE);

  const handlePageChange = (nextPage: number) => {
    setPage(nextPage);
    resultsSectionRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  };

  return (
    <div
      className="container mx-auto max-w-7xl space-y-8 p-4 pb-28 sm:p-6 md:pb-8"
      data-spekit={SPEKIT.studentResultsPage}
    >
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-l from-teal-700 via-emerald-600 to-teal-800 p-6 text-white shadow-xl sm:p-8">
        <div
          aria-hidden
          className="pointer-events-none absolute -left-16 top-0 size-48 rounded-full bg-white/10 blur-3xl"
        />
        <div className="relative z-10 flex flex-col items-start justify-between gap-5 md:flex-row md:items-center">
          <div className="space-y-2">
            <Badge className="rounded-full border-white/20 bg-white/15 px-3 py-1 text-xs text-white backdrop-blur-md">
              <Sparkles className="ms-1 size-3.5 text-amber-300" />
              سجل الإنجاز
            </Badge>
            <h1 className="text-2xl font-black tracking-tight sm:text-3xl">
              نتائجي
            </h1>
            <p className="max-w-md text-sm leading-relaxed text-emerald-50/90">
              تابع تطور أدائك، راجع إجاباتك، وأعد المحاولة لتحسين معدلك.
            </p>
          </div>

          <div className="grid w-full grid-cols-3 gap-2 rounded-2xl border border-white/20 bg-white/10 p-3 backdrop-blur-md sm:w-auto sm:gap-3 sm:p-3.5">
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

      {teacherGamification ? (
        <LevelProgressCard
          status={teacherGamification}
          compact
          spekitId={SPEKIT.gamifResultsSummary}
        />
      ) : null}

      <div className="flex flex-col items-stretch justify-between gap-4 rounded-2xl border border-border/60 bg-card p-4 shadow-sm sm:flex-row sm:items-center">
        <div className="relative w-full sm:w-80">
          <Search className="pointer-events-none absolute end-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="h-11 rounded-2xl border-border/60 bg-muted/30 pe-10 text-sm focus-visible:ring-emerald-500"
            placeholder="ابحث في النتائج..."
            value={searchQuery}
            onChange={(event) => {
              setSearchQuery(event.target.value);
              resetPage();
            }}
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
              onClick={() => {
                setSelectedCategory(category);
                resetPage();
              }}
              className={cn(
                "h-11 shrink-0 rounded-2xl px-4 text-sm font-bold",
                selectedCategory === category &&
                  "bg-emerald-600 text-white hover:bg-emerald-700"
              )}
            >
              {category}
            </Button>
          ))}
        </div>
      </div>

      {scores.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border/60 bg-muted/20 px-6 py-16 text-center">
          <BarChart3 className="mb-4 size-10 text-muted-foreground" />
          <p className="text-sm font-semibold">ما في نتائج بعد</p>
          <p className="mt-1 text-sm text-muted-foreground">
            حلّ أول اختبار وشوف نتيجتك هون!
          </p>
          <Link
            href="/quizzes"
            className={cn(
              buttonVariants({ size: "lg" }),
              "mt-5 h-12 rounded-2xl bg-emerald-600 font-bold hover:bg-emerald-700"
            )}
          >
            ابدأ أول اختبار
          </Link>
        </div>
      ) : filteredTotal === 0 ? (
        <div className="rounded-2xl border border-dashed border-border/60 bg-muted/20 px-6 py-10 text-center">
          <p className="text-sm font-semibold">ما في نتائج مطابقة لبحثك</p>
          <p className="mt-1 text-sm text-muted-foreground">
            جرّب كلمة مختلفة أو غيّر التصنيف.
          </p>
        </div>
      ) : (
        <section
          ref={resultsSectionRef}
          className="scroll-mt-24 space-y-4"
          id="results"
        >
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-base font-bold text-foreground">سجل المحاولات</h2>
            <span className="text-sm font-medium tabular-nums text-muted-foreground">
              ({filteredTotal} نتيجة)
            </span>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {paginatedScores.map((row) => (
              <ResultCard key={row.submissionId} row={row} />
            ))}
          </div>

          <PaginationControls
            page={page}
            totalPages={totalPages}
            total={filteredTotal}
            pageSize={STUDENT_RESULTS_PAGE_SIZE}
            onPageChange={handlePageChange}
            itemLabel="نتيجة"
            variant="compact"
            className="mt-2 flex flex-row items-center justify-center gap-3 rounded-2xl border border-border bg-card px-3 py-3 sm:px-4"
            dataSpekit={SPEKIT.studentPagination}
          />
        </section>
      )}
    </div>
  );
}

function ResultCard({ row }: { row: RecentScoreRow }) {
  const grade = getScoreGrade(row.score);

  return (
    <Card
      data-spekit={`results-card-${row.submissionId}`}
      className="flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-sm transition-all duration-200 hover:shadow-md"
    >
      <CardContent className="flex h-full flex-col gap-4 p-5 sm:p-6">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1 space-y-2.5">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="line-clamp-2 text-base font-extrabold leading-snug text-foreground sm:text-lg">
                {row.quizTitle}
              </h3>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Badge
                variant="outline"
                className="rounded-full border-emerald-200/80 bg-emerald-50/70 px-2.5 py-0.5 text-xs font-bold text-emerald-800 dark:border-emerald-800/50 dark:bg-emerald-950/40 dark:text-emerald-200"
              >
                {row.categoryName}
              </Badge>
              <Badge
                className={cn(
                  "rounded-full border text-xs font-semibold",
                  gradePillClassName(grade.tone)
                )}
              >
                {grade.label}
              </Badge>
            </div>

            <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-1.5">
                <Calendar className="size-3.5 shrink-0" aria-hidden />
                <span dir="ltr" className="tabular-nums">
                  {formatSubmittedDate(row.submittedAt)}
                </span>
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Clock className="size-3.5 shrink-0" aria-hidden />
                <span dir="ltr" className="tabular-nums">
                  {formatSubmittedTime(row.submittedAt)}
                </span>
              </span>
            </div>
          </div>

          <span
            className={cn(
              "flex h-12 w-12 shrink-0 items-center justify-center rounded-full border text-lg font-bold tabular-nums shadow-sm",
              scoreBadgeClassName(grade.tone)
            )}
            aria-label={`النتيجة ${row.score}%`}
          >
            {row.score}%
          </span>
        </div>

        <div className="mt-auto grid grid-cols-2 gap-2 pt-1">
          <Link
            href={`/results/${row.submissionId}`}
            className={cn(
              buttonVariants({ size: "sm" }),
              "h-9 gap-1.5 rounded-xl bg-emerald-600 text-sm font-medium text-white hover:bg-emerald-700"
            )}
          >
            <Eye className="size-3.5 shrink-0" aria-hidden />
            مراجعة الإجابات
          </Link>
          <Link
            href={`/quiz/${row.quizId}`}
            className={cn(
              buttonVariants({ variant: "outline", size: "sm" }),
              "h-9 gap-1.5 rounded-xl border-border text-sm font-medium"
            )}
          >
            <RotateCcw className="size-3.5 shrink-0" aria-hidden />
            إعادة المحاولة
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
      <Icon className="mx-auto mb-1 size-4 text-amber-300" />
      <div className="text-lg font-black leading-none tabular-nums">{value}</div>
      <p className="mt-1 text-[10px] font-medium text-emerald-100">{label}</p>
    </div>
  );
}
