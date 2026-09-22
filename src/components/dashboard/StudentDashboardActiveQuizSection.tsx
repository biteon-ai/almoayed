"use client";

import Link from "next/link";
import type { QuizCarouselItem } from "@/types/database";
import { formatDurationAr, getQuizListAction } from "@/lib/student-quiz-ui";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button-variants";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { SPEKIT, spekit } from "@/lib/spekit-targets";
import { cn } from "@/lib/utils";
import { quizPlayerHref } from "@/lib/quiz-route-prefetch";
import { usePrefetchOnIntent } from "@/hooks/use-prefetch-on-intent";
import {
  Play,
  ArrowLeft,
  BookOpen,
  Clock,
  HelpCircle,
  RotateCcw,
} from "lucide-react";

interface StudentDashboardActiveQuizSectionProps {
  continueQuiz: QuizCarouselItem | null;
  continueProgress: number;
}

export function StudentDashboardActiveQuizSection({
  continueQuiz,
  continueProgress,
}: StudentDashboardActiveQuizSectionProps) {
  const action = continueQuiz ? getQuizListAction(continueQuiz) : null;
  const href = continueQuiz ? quizPlayerHref(continueQuiz.id) : null;
  const { ref, intentProps } = usePrefetchOnIntent(href);

  return (
    <div data-spekit={SPEKIT.studentQuizList}>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h2 className="flex max-w-full items-center gap-2 text-base font-bold leading-snug text-foreground sm:text-lg">
          <Play className="h-4 w-4 shrink-0 fill-emerald-600/20 text-emerald-600" />
          <span>
            {action?.kind === "retake"
              ? "جاهز لمحاولة جديدة"
              : action?.kind === "review"
                ? "آخر نتيجة للمراجعة"
                : "تابع من حيث توقفت"}
          </span>
        </h2>

        <Link
          href="/quizzes"
          className={cn(
            buttonVariants({ variant: "ghost", size: "sm" }),
            "h-8 gap-1 rounded-xl px-2 text-xs font-bold text-emerald-600",
            "hover:bg-emerald-50 hover:text-emerald-700 sm:gap-1.5 sm:px-3"
          )}
        >
          <span>عرض جميع الاختبارات</span>
          <ArrowLeft className="h-3.5 w-3.5 shrink-0" aria-hidden />
        </Link>
      </div>

      {continueQuiz && action ? (
        <Card
          ref={ref}
          className="overflow-hidden rounded-2xl border-2 border-emerald-500/20 bg-gradient-to-br from-emerald-50/40 via-background to-teal-50/20 shadow-xs dark:from-emerald-950/20 dark:to-background"
          {...intentProps}
        >
          <CardContent className="flex flex-col items-start justify-between gap-4 p-4 sm:flex-row sm:items-center sm:gap-6 sm:p-6">
            <div className="w-full min-w-0 max-w-xl space-y-3">
              <div className="flex items-center gap-2">
                <Badge className="border-amber-200/60 bg-amber-500/15 text-xs font-semibold text-amber-700 dark:text-amber-300">
                  {action.kind === "retake"
                    ? "يمكن الإعادة"
                    : action.kind === "review"
                      ? "مكتمل"
                      : `قيد التقدم (${continueProgress}%)`}
                </Badge>
              </div>

              <div>
                <h3 className="text-lg font-bold leading-snug text-foreground sm:text-xl">
                  {continueQuiz.title}
                </h3>
                <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <HelpCircle className="h-3.5 w-3.5 text-emerald-600" />
                    {continueQuiz.questionCount}{" "}
                    {continueQuiz.questionCount === 1 ? "سؤال" : "أسئلة"}
                  </span>
                  <span className="text-muted-foreground/50" aria-hidden>
                    •
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5 text-teal-600" />
                    {formatDurationAr(continueQuiz.estimatedMinutes)}
                  </span>
                </p>
              </div>

              {action.kind === "start" ? (
                <Progress
                  className="h-2 rounded-full bg-emerald-100 dark:bg-emerald-950"
                  value={continueProgress}
                />
              ) : null}
            </div>

            <Link
              href={href!}
              prefetch
              className={cn(
                buttonVariants({ size: "lg" }),
                "h-11 w-full shrink-0 gap-2 rounded-xl bg-emerald-600 px-6 text-sm font-bold text-white shadow-md hover:bg-emerald-700 sm:w-auto"
              )}
              {...(action.kind === "retake"
                ? spekit(SPEKIT.quizRetakeCta)
                : {})}
            >
              <span>{action.label}</span>
              {action.kind === "retake" ? (
                <RotateCcw className="h-4 w-4" />
              ) : (
                <ArrowLeft className="h-4 w-4" />
              )}
            </Link>
          </CardContent>
        </Card>
      ) : (
        <Card className="space-y-3 rounded-2xl border border-dashed bg-card/50 p-6 text-center sm:p-8">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-600">
            <BookOpen className="h-6 w-6" />
          </div>
          <div className="space-y-1">
            <h3 className="text-sm font-bold text-foreground">
              لا يوجد اختبار قيد التقدم حالياً
            </h3>
            <p className="text-xs text-muted-foreground">
              تصفح قائمة الاختبارات المتاحة واستعد للتحدي القادم!
            </p>
          </div>
          <Link
            href="/quizzes"
            className={cn(
              buttonVariants({ size: "sm" }),
              "h-9 rounded-xl bg-emerald-600 px-4 text-xs font-bold text-white hover:bg-emerald-700"
            )}
          >
            تصفح الاختبارات
          </Link>
        </Card>
      )}
    </div>
  );
}
