"use client";

import Link from "next/link";
import type { QuizCarouselItem } from "@/types/database";
import { formatDurationAr } from "@/lib/student-quiz-ui";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button-variants";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { SPEKIT } from "@/lib/spekit-targets";
import { cn } from "@/lib/utils";
import { Play, ArrowLeft, BookOpen, Clock, HelpCircle } from "lucide-react";

interface StudentDashboardActiveQuizSectionProps {
  continueQuiz: QuizCarouselItem | null;
  continueProgress: number;
}

export function StudentDashboardActiveQuizSection({
  continueQuiz,
  continueProgress,
}: StudentDashboardActiveQuizSectionProps) {
  return (
    <div className="space-y-4" data-spekit={SPEKIT.studentQuizList}>
      <div className="flex items-center justify-between gap-3">
        <h2 className="flex items-center gap-2 text-lg font-bold text-foreground">
          <Play className="h-4 w-4 fill-emerald-600/20 text-emerald-600" />
          <span>تابع من حيث توقفت</span>
        </h2>

        <Link
          href="/quizzes"
          className={cn(
            buttonVariants({ variant: "ghost", size: "sm" }),
            "flex items-center gap-1.5 rounded-xl text-xs font-bold text-emerald-600 hover:bg-emerald-50 hover:text-emerald-700"
          )}
        >
          <span>عرض جميع الاختبارات</span>
          <ArrowLeft className="h-3.5 w-3.5" />
        </Link>
      </div>

      {continueQuiz ? (
        <Card className="overflow-hidden rounded-2xl border-2 border-emerald-500/20 bg-gradient-to-br from-emerald-50/40 via-background to-teal-50/20 shadow-xs dark:from-emerald-950/20 dark:to-background">
          <CardContent className="flex flex-col items-start justify-between gap-6 p-5 sm:flex-row sm:items-center sm:p-6">
            <div className="w-full max-w-xl space-y-3">
              <div className="flex items-center gap-2">
                <Badge className="border-amber-200/60 bg-amber-500/15 text-xs font-semibold text-amber-700 dark:text-amber-300">
                  {continueQuiz.hasSubmission ? "للمراجعة" : "قيد التقدم"} (
                  {continueProgress}%)
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
                "h-11 w-full shrink-0 gap-2 rounded-xl bg-emerald-600 px-6 text-sm font-bold text-white shadow-md hover:bg-emerald-700 sm:w-auto"
              )}
            >
              <span>
                {continueQuiz.hasSubmission
                  ? "مراجعة الاختبار"
                  : "متابعة الاختبار"}
              </span>
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </CardContent>
        </Card>
      ) : (
        <Card className="space-y-3 rounded-2xl border border-dashed bg-card/50 p-8 text-center">
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
