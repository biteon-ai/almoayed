"use client";

import {
  CheckCircle2,
  ChevronLeft,
  FileQuestion,
  Sparkles,
  XCircle,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { SPEKIT } from "@/lib/spekit-targets";
import { PaginatedAvailableQuizzes } from "@/components/teacher/PaginatedAvailableQuizzes";
import type { TeacherStudentAnalytics } from "@/types/database";

type RecentSubmission = TeacherStudentAnalytics["recentSubmissions"][number];

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString("ar-SY", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return iso;
  }
}

interface StudentOverviewSectionProps {
  quizBreakdown: TeacherStudentAnalytics["quizBreakdown"];
  recentSubmissions: RecentSubmission[];
}

export function StudentOverviewSection({
  quizBreakdown,
  recentSubmissions,
}: StudentOverviewSectionProps) {
  return (
    <div className="grid w-full grid-cols-1 gap-6 lg:grid-cols-12">
      <div className="lg:col-span-5">
        <PaginatedAvailableQuizzes availableQuizzes={quizBreakdown} />
      </div>

      <Card
        className="flex flex-col rounded-2xl border bg-card shadow-sm lg:col-span-7"
        data-spekit={SPEKIT.studentDetailRecentSubmissions}
      >
        <CardHeader className="border-b bg-muted/20 px-5 py-4">
          <CardTitle className="flex items-center gap-2 text-base font-bold">
            <Sparkles className="size-4 text-amber-500" aria-hidden />
            <span>آخر المحاولات والنتائج</span>
          </CardTitle>
        </CardHeader>

        <CardContent className="flex flex-1 flex-col items-center justify-center p-6">
          {recentSubmissions.length === 0 ? (
            <div className="flex max-w-sm flex-col items-center justify-center space-y-3 py-12 text-center">
              <div className="flex size-16 items-center justify-center rounded-full border border-emerald-200/50 bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40">
                <FileQuestion className="size-8 stroke-[1.5]" aria-hidden />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-bold text-foreground">
                  لم يُسلّم أي اختبار بعد
                </h3>
                <p className="text-xs leading-relaxed text-muted-foreground">
                  عندما يدخل الطالب للاختبارات ويقوم بتسليم إجاباته، ستظهر
                  الدرجات وتفاصيل الحلول بالتفصيل هنا.
                </p>
              </div>
            </div>
          ) : (
            <div className="w-full space-y-3">
              {recentSubmissions.map((attempt) => (
                <div
                  key={`${attempt.quizId}-${attempt.submittedAt}`}
                  className="flex items-center justify-between gap-3 rounded-xl border bg-background p-4 transition-colors hover:bg-muted/20"
                >
                  <div className="min-w-0 text-start">
                    <h4 className="truncate text-sm font-bold">
                      {attempt.quizTitle}
                    </h4>
                    <span className="text-xs text-muted-foreground">
                      {formatDate(attempt.submittedAt)}
                    </span>
                  </div>
                  <div className="flex shrink-0 items-center gap-3">
                    <span
                      className={cn(
                        "text-base font-extrabold tabular-nums",
                        attempt.passed ? "text-emerald-600" : "text-amber-600"
                      )}
                    >
                      {attempt.score}%
                    </span>
                    {attempt.passed ? (
                      <CheckCircle2 className="size-4 text-emerald-600" />
                    ) : (
                      <XCircle className="size-4 text-amber-600" />
                    )}
                    <ChevronLeft
                      className="size-4 text-muted-foreground"
                      aria-hidden
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
