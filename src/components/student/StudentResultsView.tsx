"use client";

import type { ComponentType } from "react";
import { useCallback, useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import type { DashboardStats, RecentScoreRow } from "@/types/database";
import type { TeacherGamificationStatus } from "@/lib/teacher-gamification";
import { PaginationControls } from "@/components/ui/pagination-controls";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { buttonVariants } from "@/components/ui/button-variants";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScoreRingBadge } from "@/components/ui/score-ring-badge";
import { LocalDateTime } from "@/components/ui/local-datetime";
import {
  StudentPageHero,
  StudentPageHeroBadge,
  studentPageHeroTitleClassName,
} from "@/components/student/StudentPageHero";

const LevelProgressCard = dynamic(
  () =>
    import("@/components/dashboard/LevelProgressCard").then(
      (mod) => mod.LevelProgressCard
    ),
  {
    loading: () => (
      <div className="h-16 animate-pulse rounded-2xl border bg-muted/30" />
    ),
  }
);
import {
  QUIZ_CATEGORY_FILTERS,
  STUDENT_RESULTS_PAGE_SIZE,
  type QuizCategoryFilter,
  type QuizResultGroup,
  filterQuizzesByCategory,
  filterQuizzesBySearch,
  getScoreGrade,
  gradePillClassName,
  groupResultsByQuiz,
} from "@/lib/student-quiz-ui";
import { SPEKIT } from "@/lib/spekit-targets";
import {
  prefetchQuizRoute,
  quizPlayerHref,
} from "@/lib/quiz-route-prefetch";
import { usePrefetchOnIntent } from "@/hooks/use-prefetch-on-intent";
import { cn, scrollbarHideClass } from "@/lib/utils";
import {
  BarChart3,
  BookOpen,
  Calendar,
  CheckCircle2,
  ChevronDown,
  Clock,
  Eye,
  History,
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

export function StudentResultsView({
  stats,
  scores,
  totalQuizzes,
  teacherGamification,
}: StudentResultsViewProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] =
    useState<QuizCategoryFilter>("الكل");
  const resultsSectionRef = useRef<HTMLElement>(null);

  const page = Math.max(1, Number(searchParams.get("page")) || 1);

  const pushQuery = useCallback(
    (patch: Record<string, string | undefined>) => {
      const next = new URLSearchParams(searchParams.toString());
      for (const [key, value] of Object.entries(patch)) {
        if (!value) next.delete(key);
        else next.set(key, value);
      }
      const qs = next.toString();
      router.push(qs ? `${pathname}?${qs}` : pathname);
    },
    [pathname, router, searchParams]
  );

  const filteredScores = useMemo(() => {
    const byCategory = filterQuizzesByCategory(scores, selectedCategory);
    return filterQuizzesBySearch(byCategory, searchQuery);
  }, [scores, selectedCategory, searchQuery]);

  const groups = useMemo(
    () => groupResultsByQuiz(filteredScores),
    [filteredScores]
  );

  const pageSize = STUDENT_RESULTS_PAGE_SIZE;
  const totalGroups = groups.length;
  const totalPages = Math.max(1, Math.ceil(totalGroups / pageSize) || 1);
  const safePage = Math.min(page, totalPages);
  const pagedGroups = groups.slice(
    (safePage - 1) * pageSize,
    safePage * pageSize
  );

  const handlePageChange = (nextPage: number) => {
    pushQuery({ page: String(nextPage) });
    resultsSectionRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  };

  const resetPage = () => {
    pushQuery({ page: undefined });
  };

  return (
    <div
      className="container mx-auto max-w-7xl space-y-4 p-4 pb-28 sm:space-y-6 sm:p-6 md:pb-8"
      data-spekit={SPEKIT.studentResultsPage}
    >
      <StudentPageHero
        variant="teal"
        hideTitleOnMobile
        badge={
          <StudentPageHeroBadge variant="teal">
            <Sparkles className="size-3 shrink-0 text-amber-300" />
            <span className="truncate">سجل الإنجاز</span>
          </StudentPageHeroBadge>
        }
        title={
          <h1 className={studentPageHeroTitleClassName()}>نتائجي</h1>
        }
        subtitle="تابع تطور أدائك، راجع إجاباتك، وأعد المحاولة لتحسين معدلك."
      >
        <div className="grid w-full min-w-0 grid-cols-3 items-center justify-items-center gap-2 rounded-xl border border-white/20 bg-white/10 px-2 py-2 backdrop-blur-md sm:w-auto sm:min-w-[12rem] sm:gap-3 sm:px-3 sm:py-2.5">
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
      </StudentPageHero>

      {teacherGamification ? (
        <LevelProgressCard
          status={teacherGamification}
          compact
          spekitId={SPEKIT.gamifResultsSummary}
        />
      ) : null}

      <div className="min-w-0 overflow-hidden rounded-2xl border border-border/60 bg-card px-4 py-3 shadow-sm">
        <div className="flex min-w-0 flex-col gap-2">
          <div className="relative w-full min-w-0">
            <Search className="pointer-events-none absolute end-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              className="h-9 w-full rounded-xl border-border/50 bg-muted/25 py-1.5 pe-9 text-sm focus-visible:ring-emerald-500"
              placeholder="ابحث في النتائج..."
              value={searchQuery}
              onChange={(event) => {
                setSearchQuery(event.target.value);
                resetPage();
              }}
              aria-label="بحث في النتائج"
            />
          </div>

          <div
            className={cn(
              "flex min-w-0 w-full items-center gap-1.5 overflow-x-auto overscroll-x-contain whitespace-nowrap [-webkit-overflow-scrolling:touch]",
              scrollbarHideClass
            )}
            role="toolbar"
            aria-label="تصفية حسب التصنيف"
          >
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
                  "h-8 shrink-0 rounded-full px-3 text-xs font-semibold",
                  selectedCategory === category &&
                    "bg-emerald-600 text-white hover:bg-emerald-700"
                )}
              >
                {category}
              </Button>
            ))}
          </div>
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
      ) : totalGroups === 0 ? (
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
              ({totalGroups} اختبار)
            </span>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {pagedGroups.map((group) => (
              <QuizResultGroupCard key={group.quizId} group={group} />
            ))}
          </div>

          {totalPages > 1 ? (
            <PaginationControls
              page={safePage}
              totalPages={totalPages}
              total={totalGroups}
              pageSize={pageSize}
              onPageChange={handlePageChange}
              itemLabel="اختبار"
              variant="compact"
              className="mt-2 flex flex-row items-center justify-center gap-3 rounded-2xl border border-border bg-card px-3 py-3 sm:px-4"
              dataSpekit={SPEKIT.studentPagination}
            />
          ) : null}
        </section>
      )}
    </div>
  );
}

function QuizResultGroupCard({ group }: { group: QuizResultGroup }) {
  const { latest, archive } = group;
  const grade = getScoreGrade(latest.score);
  const [archiveOpen, setArchiveOpen] = useState(false);
  const attemptCount = archive.length + 1;
  const router = useRouter();
  const reviewHref = quizPlayerHref(latest.quizId, {
    reviewSubmissionId: latest.submissionId,
  });
  const retakeHref = quizPlayerHref(latest.quizId);
  const { ref, intentProps } = usePrefetchOnIntent(reviewHref);

  return (
    <Card
      ref={ref}
      data-spekit={`${SPEKIT.resultsCard}-${latest.submissionId}`}
      className="flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-sm transition-all duration-200 hover:shadow-md dark:border-slate-700 dark:bg-slate-900 dark:shadow-none dark:hover:shadow-none"
      {...intentProps}
    >
      <CardContent className="flex h-full flex-col gap-3 p-4 sm:gap-4 sm:p-5">
        <div className="flex items-center justify-between gap-3 sm:gap-4">
          <ScoreRingBadge
            score={latest.score}
            size="md"
            className="shrink-0 self-center"
          />

          <div className="min-w-0 flex-1 space-y-1.5 text-start">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="line-clamp-2 text-sm font-extrabold leading-snug text-foreground sm:text-base">
                {latest.quizTitle}
              </h3>
              {attemptCount > 1 ? (
                <Badge
                  variant="outline"
                  className="rounded-full px-2 py-0 text-[10px] font-bold text-muted-foreground"
                >
                  {attemptCount} محاولات
                </Badge>
              ) : null}
            </div>

            <div className="flex flex-wrap items-center gap-1.5">
              <Badge
                variant="outline"
                className="rounded-full border-emerald-200/80 bg-emerald-50/70 px-2 py-0 text-[11px] font-bold text-emerald-800 dark:border-emerald-800/50 dark:bg-emerald-950/40 dark:text-emerald-200"
              >
                {latest.categoryName}
              </Badge>
              <Badge
                className={cn(
                  "rounded-full border px-2 py-0 text-[11px] font-semibold",
                  gradePillClassName(grade.tone)
                )}
              >
                {grade.label}
              </Badge>
              <Badge
                variant="outline"
                className="rounded-full border-sky-200/80 bg-sky-50/70 px-2 py-0 text-[10px] font-bold text-sky-800 dark:border-sky-800/50 dark:bg-sky-950/40 dark:text-sky-200"
              >
                أحدث محاولة
              </Badge>
            </div>

            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-muted-foreground sm:text-xs">
              <span className="inline-flex min-w-0 items-center gap-1.5">
                <Calendar className="size-3.5 shrink-0" aria-hidden />
                <LocalDateTime iso={latest.submittedAt} mode="date" />
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Clock className="size-3.5 shrink-0" aria-hidden />
                <LocalDateTime iso={latest.submittedAt} mode="time" />
              </span>
            </div>
          </div>
        </div>

        <div className="mt-auto flex flex-col gap-2.5 border-t border-border/50 pt-3 dark:border-slate-700/80">
          <div className="flex flex-col gap-2.5 min-[380px]:flex-row min-[380px]:gap-3">
            <Link
              href={reviewHref}
              prefetch
              className={cn(
                buttonVariants({ size: "sm" }),
                "flex min-h-11 min-w-0 flex-1 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-emerald-700 sm:py-3"
              )}
            >
              <Eye className="size-4 shrink-0" aria-hidden />
              <span className="truncate">مراجعة الإجابات</span>
            </Link>
            <Link
              href={retakeHref}
              prefetch
              onMouseEnter={() => prefetchQuizRoute(router, retakeHref)}
              onFocus={() => prefetchQuizRoute(router, retakeHref)}
              className={cn(
                buttonVariants({ variant: "outline", size: "sm" }),
                "flex min-h-11 min-w-0 flex-1 items-center justify-center gap-2 rounded-xl border-border px-4 py-2.5 text-sm font-medium dark:border-slate-600 dark:bg-slate-800/60 dark:text-slate-100 dark:hover:bg-slate-800 sm:py-3"
              )}
              data-spekit={SPEKIT.quizRetakeCta}
            >
              <RotateCcw className="size-4 shrink-0" aria-hidden />
              <span className="truncate">إعادة المحاولة</span>
            </Link>
          </div>

          {archive.length > 0 ? (
            <div className="space-y-2">
              <button
                type="button"
                onClick={() => setArchiveOpen((open) => !open)}
                className={cn(
                  "flex w-full min-h-10 items-center justify-between gap-2 rounded-xl px-3 py-2",
                  "border border-border/60 bg-muted/30 text-start text-xs font-bold text-foreground",
                  "transition-colors hover:bg-muted dark:border-slate-700 dark:bg-slate-800/50"
                )}
                aria-expanded={archiveOpen}
                data-spekit={SPEKIT.resultsArchiveToggle}
              >
                <span className="inline-flex items-center gap-1.5">
                  <History className="size-3.5 shrink-0 text-muted-foreground" aria-hidden />
                  سجل المحاولات السابقة
                  <span className="tabular-nums text-muted-foreground">
                    ({archive.length})
                  </span>
                </span>
                <ChevronDown
                  className={cn(
                    "size-4 shrink-0 text-muted-foreground transition-transform",
                    archiveOpen && "rotate-180"
                  )}
                  aria-hidden
                />
              </button>

              {archiveOpen ? (
                <ul
                  className="space-y-1.5 rounded-xl border border-border/50 bg-muted/20 p-2 dark:border-slate-700 dark:bg-slate-950/40"
                  data-spekit={SPEKIT.resultsArchiveList}
                >
                  {archive.map((row, index) => (
                    <li key={row.submissionId}>
                      <Link
                        href={quizPlayerHref(row.quizId, {
                          reviewSubmissionId: row.submissionId,
                        })}
                        prefetch
                        onMouseEnter={() =>
                          prefetchQuizRoute(
                            router,
                            quizPlayerHref(row.quizId, {
                              reviewSubmissionId: row.submissionId,
                            })
                          )
                        }
                        className={cn(
                          "flex items-center justify-between gap-3 rounded-lg px-2.5 py-2",
                          "transition-colors hover:bg-background dark:hover:bg-slate-900"
                        )}
                      >
                        <div className="min-w-0 flex-1 space-y-0.5 text-start">
                          <p className="text-xs font-bold text-foreground">
                            محاولة {archive.length - index}
                          </p>
                          <p className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[10px] text-muted-foreground">
                            <LocalDateTime iso={row.submittedAt} mode="date" />
                            <span aria-hidden>·</span>
                            <LocalDateTime iso={row.submittedAt} mode="time" />
                          </p>
                        </div>
                        <ScoreRingBadge
                          score={row.score}
                          size="sm"
                          className="shrink-0"
                        />
                      </Link>
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>
          ) : null}
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
    <div className="flex w-full min-w-0 flex-col items-center justify-center px-1 text-center">
      <Icon className="mb-0.5 size-3.5 shrink-0 text-amber-300" />
      <div className="w-full overflow-visible text-sm font-black leading-none tabular-nums sm:text-base">
        {value}
      </div>
      <p className="mt-0.5 w-full truncate text-[10px] font-medium text-emerald-100">
        {label}
      </p>
    </div>
  );
}
