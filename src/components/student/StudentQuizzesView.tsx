"use client";

import type { ComponentType } from "react";
import { useMemo, useRef, useState } from "react";
import Link from "next/link";
import type { DashboardStats, QuizCarouselItem } from "@/types/database";
import { StudentQuizGridCard } from "@/components/student/StudentQuizGridCard";
import { PaginationControls } from "@/components/ui/pagination-controls";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button"
import { buttonVariants } from "@/components/ui/button-variants";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { usePagination } from "@/hooks/usePagination";
import {
  QUIZ_CATEGORY_FILTERS,
  STUDENT_EXAMS_PAGE_SIZE,
  type QuizCategoryFilter,
  filterQuizzesByCategory,
  filterQuizzesBySearch,
  formatDurationAr,
} from "@/lib/student-quiz-ui";
import { splitQuizExamSections } from "@/lib/quiz-exam-list";
import { PendingSyncBadge } from "@/components/quiz/PendingSyncBadge";
import { SPEKIT } from "@/lib/spekit-targets";
import { cn } from "@/lib/utils";
import {
  BookOpen,
  Search,
  Clock,
  HelpCircle,
  Play,
  Sparkles,
  Target,
  CheckCircle2,
  ClipboardList,
} from "lucide-react";

interface StudentQuizzesViewProps {
  stats: DashboardStats;
  quizzes: QuizCarouselItem[];
}

export function StudentQuizzesView({ stats, quizzes }: StudentQuizzesViewProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] =
    useState<QuizCategoryFilter>("الكل");
  const quizzesSectionRef = useRef<HTMLElement>(null);

  const { continueQuiz, queueQuizzes } = useMemo(
    () => splitQuizExamSections(quizzes),
    [quizzes]
  );

  const filteredQuizzes = useMemo(() => {
    const byCategory = filterQuizzesByCategory(queueQuizzes, selectedCategory);
    return filterQuizzesBySearch(byCategory, searchQuery);
  }, [queueQuizzes, selectedCategory, searchQuery]);

  const {
    items: paginatedQuizzes,
    page,
    totalPages,
    total: filteredTotal,
    setPage,
    resetPage,
  } = usePagination(filteredQuizzes, STUDENT_EXAMS_PAGE_SIZE);

  const handlePageChange = (nextPage: number) => {
    setPage(nextPage);
    quizzesSectionRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  };

  const continueProgress = continueQuiz
    ? continueQuiz.hasSubmission
      ? 100
      : 0
    : 0;

  return (
    <div
      className="container mx-auto max-w-7xl space-y-8 p-4 sm:p-6"
      data-spekit={SPEKIT.studentQuizzesPage}
    >
      <PendingSyncBadge />
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-800 p-6 text-white shadow-xl sm:p-8">
        <div className="relative z-10 flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
          <div className="space-y-1.5">
            <Badge className="rounded-full border-white/20 bg-white/15 px-3 py-1 text-xs text-white backdrop-blur-md">
              <Sparkles className="ml-1 h-3.5 w-3.5 text-amber-300" />
              مركز الاختبارات
            </Badge>
            <h1 className="text-2xl font-black sm:text-3xl">الاختبارات المتاحة</h1>
            <p className="text-xs text-emerald-100 sm:text-sm">
              اختر اختبارك وابدأ التحدي لتقييم مستواك وتطوير مهاراتك اليومية.
            </p>
          </div>

          <div className="grid grid-cols-3 gap-2 rounded-2xl border border-white/20 bg-white/10 p-3 backdrop-blur-md sm:gap-3 sm:p-3.5">
            <QuickStat
              icon={BookOpen}
              value={quizzes.length}
              label="متاح"
            />
            <QuickStat
              icon={CheckCircle2}
              value={stats.completedQuizCount}
              label="مكتمل"
            />
            <QuickStat
              icon={Target}
              value={`${stats.overallAverageScore}%`}
              label="المعدل"
            />
          </div>
        </div>
      </section>

      <div className="flex flex-col items-center justify-between gap-4 rounded-2xl border bg-card p-4 shadow-xs sm:flex-row">
        <div className="relative w-full sm:w-80">
          <Search className="absolute end-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="h-10 rounded-xl border-muted bg-muted/30 pe-10 text-xs focus-visible:ring-emerald-500"
            placeholder="ابحث عن اختبار..."
            value={searchQuery}
            onChange={(event) => {
              setSearchQuery(event.target.value);
              resetPage();
            }}
            aria-label="بحث في الاختبارات"
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

      {continueQuiz ? (
        <section className="space-y-3">
          <h2 className="flex items-center gap-2 text-base font-bold text-foreground">
            <Play className="h-4 w-4 fill-emerald-600/20 text-emerald-600" />
            <span>تابع من حيث توقفت</span>
          </h2>

          <Card className="overflow-hidden rounded-2xl border-2 border-emerald-500/30 bg-gradient-to-br from-emerald-50/30 via-background to-teal-50/20 shadow-md dark:from-emerald-950/20">
            <CardContent className="flex flex-col items-start justify-between gap-6 p-5 sm:flex-row sm:items-center sm:p-6">
              <div className="w-full max-w-xl space-y-3">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge className="border-amber-200 bg-amber-500/15 text-xs font-semibold text-amber-700 dark:text-amber-300">
                    {continueQuiz.hasSubmission ? "للمراجعة" : "قيد التقدم"} (
                    {continueProgress}%)
                  </Badge>
                  <Badge className="text-xs" variant="outline">
                    {continueQuiz.categoryName}
                  </Badge>
                </div>

                <div>
                  <h3 className="text-xl font-bold text-foreground">
                    {continueQuiz.title}
                  </h3>
                  <p className="mt-1 flex items-center gap-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <HelpCircle className="h-3.5 w-3.5 text-emerald-600" />
                      {continueQuiz.questionCount}{" "}
                      {continueQuiz.questionCount === 1 ? "سؤال" : "أسئلة"}
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5 text-teal-600" />
                      {formatDurationAr(continueQuiz.estimatedMinutes)}
                    </span>
                  </p>
                </div>

                <Progress
                  className="h-2 rounded-full bg-emerald-100 dark:bg-emerald-950"
                  value={continueProgress}
                />
              </div>

              <Link
                href={`/quiz/${continueQuiz.id}`}
                className={cn(
                  buttonVariants({ size: "lg" }),
                  "h-11 shrink-0 gap-2 rounded-xl bg-emerald-600 px-6 text-sm font-bold text-white shadow-md hover:bg-emerald-700 sm:w-auto w-full"
                )}
              >
                <span>
                  {continueQuiz.hasSubmission
                    ? "مراجعة الاختبار"
                    : "متابعة الاختبار"}
                </span>
                <Play className="h-4 w-4 fill-white" />
              </Link>
            </CardContent>
          </Card>
        </section>
      ) : null}

      <section
        ref={quizzesSectionRef}
        className="scroll-mt-24 space-y-4"
        id="quizzes"
        data-spekit={SPEKIT.studentQuizList}
      >
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-foreground">
            جميع الاختبارات المتاحة
          </h2>
          <span className="text-xs font-medium text-muted-foreground">
            ({filteredTotal} اختبار)
          </span>
        </div>

        {quizzes.length === 0 ? (
          <div
            className="flex min-h-[220px] flex-col items-center justify-center rounded-2xl border border-dashed bg-muted/20 px-6 py-12 text-center"
            data-spekit={SPEKIT.studentQuizEmpty}
          >
            <ClipboardList className="mb-4 h-10 w-10 text-muted-foreground" />
            <p className="text-sm font-semibold">لا توجد اختبارات متاحة حالياً</p>
            <p className="mt-1 text-xs text-muted-foreground">
              راجع أستاذك قريباً — الاختبارات الجديدة رح تظهر هون فوراً.
            </p>
          </div>
        ) : filteredTotal === 0 ? (
          <div className="rounded-2xl border border-dashed bg-muted/20 px-6 py-10 text-center">
            <p className="text-sm font-semibold">ما في نتائج مطابقة لبحثك</p>
            <p className="mt-1 text-xs text-muted-foreground">
              جرّب كلمة مختلفة أو غيّر التصنيف.
            </p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {paginatedQuizzes.map((quiz) => (
                <StudentQuizGridCard key={quiz.id} quiz={quiz} />
              ))}
            </div>

            <PaginationControls
              page={page}
              totalPages={totalPages}
              total={filteredTotal}
              pageSize={STUDENT_EXAMS_PAGE_SIZE}
              onPageChange={handlePageChange}
              itemLabel="اختبار"
              variant="compact"
              showRangeSummary
              showQuickJump
              className="rounded-2xl border bg-card px-3 py-3 sm:px-4"
            />
          </>
        )}
      </section>
    </div>
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
