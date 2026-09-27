"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import type { RecentScoreRow } from "@/types/database";
import { PaginationControls } from "@/components/ui/pagination-controls";
import { Button } from "@/components/ui/button";
import { buttonVariants } from "@/components/ui/button-variants";
import { Input } from "@/components/ui/input";
import {
  StudentPageHero,
  StudentPageHeroBadge,
  studentPageHeroTitleClassName,
} from "@/components/student/StudentPageHero";
import { AttemptResultCard } from "@/components/student/AttemptResultCard";
import {
  QUIZ_CATEGORY_FILTERS,
  STUDENT_RESULTS_PAGE_SIZE,
  type QuizCategoryFilter,
  buildAttemptHistory,
  filterQuizzesByCategory,
  filterQuizzesBySearch,
  parseAttemptSortDirection,
} from "@/lib/student-quiz-ui";
import { SPEKIT } from "@/lib/spekit-targets";
import { cn, scrollbarHideClass } from "@/lib/utils";
import {
  ArrowDownWideNarrow,
  ArrowUpWideNarrow,
  BarChart3,
  History,
  Search,
  X,
} from "lucide-react";

interface StudentResultsHistoryViewProps {
  scores: RecentScoreRow[];
}

export function StudentResultsHistoryView({
  scores,
}: StudentResultsHistoryViewProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] =
    useState<QuizCategoryFilter>("الكل");
  const resultsSectionRef = useRef<HTMLElement>(null);

  const sort = parseAttemptSortDirection(searchParams.get("sort"));
  const quizIdFilter = searchParams.get("quizId");
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

  const quizScopedScores = useMemo(() => {
    if (!quizIdFilter) return scores;
    return scores.filter((row) => row.quizId === quizIdFilter);
  }, [scores, quizIdFilter]);

  const scopedQuizTitle = quizScopedScores[0]?.quizTitle ?? null;

  const filteredScores = useMemo(() => {
    const byCategory = filterQuizzesByCategory(
      quizScopedScores,
      selectedCategory
    );
    return filterQuizzesBySearch(byCategory, searchQuery);
  }, [quizScopedScores, selectedCategory, searchQuery]);

  const attempts = useMemo(
    () => buildAttemptHistory(filteredScores, sort),
    [filteredScores, sort]
  );

  const pageSize = STUDENT_RESULTS_PAGE_SIZE;
  const totalAttempts = attempts.length;
  const totalPages = Math.max(1, Math.ceil(totalAttempts / pageSize) || 1);
  const safePage = Math.min(page, totalPages);
  const pagedAttempts = attempts.slice(
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

  const toggleSort = () => {
    pushQuery({
      sort: sort === "desc" ? "asc" : "desc",
      page: undefined,
    });
  };

  const clearQuizFilter = () => {
    pushQuery({ quizId: undefined, page: undefined });
  };

  return (
    <div
      className="container mx-auto max-w-7xl space-y-4 p-4 pb-28 sm:space-y-6 sm:p-6 md:pb-8"
      data-spekit={SPEKIT.resultsHistoryPage}
    >
      <StudentPageHero
        variant="teal"
        hideTitleOnMobile
        badge={
          <StudentPageHeroBadge variant="teal">
            <History className="size-3 shrink-0 text-amber-300" />
            <span className="truncate">السجل الكامل</span>
          </StudentPageHeroBadge>
        }
        title={
          <h1 className={studentPageHeroTitleClassName()}>كل المحاولات</h1>
        }
        subtitle={
          scopedQuizTitle
            ? `محاولات «${scopedQuizTitle}» — رتّبها حسب التاريخ.`
            : "رتّب محاولاتك حسب التاريخ وراجع أي نتيجة سابقة."
        }
      />

      <div className="min-w-0 overflow-hidden rounded-2xl border border-border/60 bg-card px-4 py-3 shadow-sm">
        <div className="flex min-w-0 flex-col gap-2">
          {quizIdFilter && scopedQuizTitle ? (
            <div className="flex min-w-0 items-center justify-between gap-2 rounded-xl border border-emerald-200/70 bg-emerald-50/60 px-3 py-2 text-xs font-bold text-emerald-900 dark:border-emerald-800/50 dark:bg-emerald-950/30 dark:text-emerald-100">
              <span className="min-w-0 truncate">
                تصفية: {scopedQuizTitle}
              </span>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={clearQuizFilter}
                className="h-8 shrink-0 gap-1 rounded-lg px-2 text-xs"
              >
                <X className="size-3.5" aria-hidden />
                إلغاء
              </Button>
            </div>
          ) : null}

          <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:items-center">
            <div className="relative min-w-0 flex-1">
              <Search className="pointer-events-none absolute end-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input
                className="h-9 w-full rounded-xl border-border/50 bg-muted/25 py-1.5 pe-9 text-sm focus-visible:ring-emerald-500"
                placeholder="ابحث في المحاولات..."
                value={searchQuery}
                onChange={(event) => {
                  setSearchQuery(event.target.value);
                  resetPage();
                }}
                aria-label="بحث في المحاولات"
              />
            </div>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={toggleSort}
              className="h-9 shrink-0 gap-1.5 rounded-xl px-3 text-xs font-bold"
              aria-pressed={sort === "asc"}
              data-spekit={SPEKIT.resultsSortToggle}
            >
              {sort === "desc" ? (
                <>
                  <ArrowDownWideNarrow className="size-3.5 shrink-0" aria-hidden />
                  الأحدث أولاً
                </>
              ) : (
                <>
                  <ArrowUpWideNarrow className="size-3.5 shrink-0" aria-hidden />
                  الأقدم أولاً
                </>
              )}
              <span className="rounded-md bg-muted px-1.5 py-0.5 font-mono text-[10px] tabular-nums text-muted-foreground">
                {sort === "desc" ? "DESC" : "ASC"}
              </span>
            </Button>
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
          <p className="text-sm font-semibold">ما في محاولات بعد</p>
          <p className="mt-1 text-sm text-muted-foreground">
            حلّ اختباراً أولاً ثم ارجع لسجل المحاولات.
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
      ) : totalAttempts === 0 ? (
        <div className="rounded-2xl border border-dashed border-border/60 bg-muted/20 px-6 py-10 text-center">
          <p className="text-sm font-semibold">ما في محاولات مطابقة لبحثك</p>
          <p className="mt-1 text-sm text-muted-foreground">
            جرّب كلمة مختلفة أو غيّر التصنيف.
          </p>
        </div>
      ) : (
        <section
          ref={resultsSectionRef}
          className="scroll-mt-24 space-y-4"
          id="history"
          data-spekit={SPEKIT.resultsHistoryList}
        >
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-base font-bold text-foreground">
              سجل المحاولات
            </h2>
            <span className="text-sm font-medium tabular-nums text-muted-foreground">
              ({totalAttempts} محاولة)
            </span>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {pagedAttempts.map((attempt) => (
              <AttemptResultCard
                key={attempt.submissionId}
                attempt={attempt}
              />
            ))}
          </div>

          {totalPages > 1 ? (
            <PaginationControls
              page={safePage}
              totalPages={totalPages}
              total={totalAttempts}
              pageSize={pageSize}
              onPageChange={handlePageChange}
              itemLabel="محاولة"
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
