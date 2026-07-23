"use client";

import { useEffect, useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  FileText,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { paginateStudents } from "@/lib/paginate-students";
import { SPEKIT } from "@/lib/spekit-targets";
import type { TeacherStudentAnalytics } from "@/types/database";

const ITEMS_PER_PAGE = 4;

type QuizBreakdownItem = TeacherStudentAnalytics["quizBreakdown"][number];
type QuizProgressStatus = "not_started" | "in_progress" | "completed";

function quizProgressStatus(quiz: QuizBreakdownItem): QuizProgressStatus {
  if (quiz.submittedAt !== null && quiz.score !== null) {
    return "completed";
  }
  return "not_started";
}

function QuizStatusBadge({ status }: { status: QuizProgressStatus }) {
  if (status === "completed") {
    return (
      <Badge className="shrink-0 gap-1 border-emerald-200 bg-emerald-50 text-xs font-medium text-emerald-700">
        <CheckCircle2 className="size-3 text-emerald-600" />
        مكتمل
      </Badge>
    );
  }

  if (status === "in_progress") {
    return (
      <Badge
        variant="outline"
        className="shrink-0 gap-1 border-sky-200 bg-sky-50 text-xs font-medium text-sky-700"
      >
        <Clock className="size-3 text-sky-500" />
        قيد الحل
      </Badge>
    );
  }

  return (
    <Badge
      variant="outline"
      className="shrink-0 gap-1 border-amber-200 bg-amber-50 text-xs font-medium text-amber-700"
    >
      <AlertCircle className="size-3 text-amber-500" />
      لم يبدأ
    </Badge>
  );
}

function quizStatusHint(quiz: QuizBreakdownItem, status: QuizProgressStatus): string {
  if (status === "completed") {
    return `تم التسليم · ${quiz.score}%`;
  }
  if (status === "in_progress") {
    return "محاولة جارية";
  }
  return "لم يُسلّم بعد";
}

interface PaginatedAvailableQuizzesProps {
  availableQuizzes?: QuizBreakdownItem[];
}

export function PaginatedAvailableQuizzes({
  availableQuizzes = [],
}: PaginatedAvailableQuizzesProps) {
  const [currentPage, setCurrentPage] = useState(1);

  const totalItems = availableQuizzes.length;
  const { items, page, totalPages } = paginateStudents(
    availableQuizzes,
    currentPage,
    ITEMS_PER_PAGE
  );

  useEffect(() => {
    if (currentPage !== page) setCurrentPage(page);
  }, [currentPage, page]);

  return (
    <Card
      className="flex h-full flex-col justify-between rounded-2xl border bg-card shadow-sm"
      data-spekit={SPEKIT.studentDetailQuizBreakdown}
    >
      <div>
        <CardHeader className="border-b bg-muted/20 px-5 py-4">
          <div className="flex items-center justify-between gap-3">
            <CardTitle className="flex items-center gap-2 text-base font-bold">
              <FileText className="size-4 text-emerald-600" aria-hidden />
              <span>حالة الاختبارات المتاحة</span>
            </CardTitle>
            <Badge
              variant="secondary"
              className="shrink-0 bg-emerald-500/10 text-xs font-semibold text-emerald-700 dark:text-emerald-300"
            >
              {totalItems} اختبار
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="space-y-3 p-4">
          {totalItems === 0 ? (
            <div className="py-10 text-center text-xs text-muted-foreground">
              لا توجد اختبارات متاحة حالياً.
            </div>
          ) : (
            items.map((quiz) => {
              const status = quizProgressStatus(quiz);

              return (
                <div
                  key={quiz.quizId}
                  className="group flex items-center justify-between gap-3 rounded-xl border border-muted/80 bg-background p-3.5 transition-all hover:border-emerald-500/30 hover:bg-muted/30"
                >
                  <div className="min-w-0 flex-1 space-y-1 text-start">
                    <h4 className="truncate text-sm font-bold text-foreground transition-colors group-hover:text-emerald-600">
                      {quiz.title}
                    </h4>
                    <p className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Clock className="size-3 shrink-0" />
                      <span>{quizStatusHint(quiz, status)}</span>
                    </p>
                  </div>

                  <QuizStatusBadge status={status} />
                </div>
              );
            })
          )}
        </CardContent>
      </div>

      {totalPages > 1 && (
        <CardFooter className="mt-auto flex items-center justify-between border-t bg-muted/10 px-4 py-3">
          <span className="text-xs font-medium text-muted-foreground">
            صفحة{" "}
            <span className="font-bold text-foreground">{page}</span> من{" "}
            <span className="font-bold text-foreground">{totalPages}</span>
          </span>

          <div className="flex items-center gap-1">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-8 gap-1 rounded-lg px-2.5 text-xs"
              disabled={page <= 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            >
              <ChevronRight className="size-3.5" />
              <span>السابق</span>
            </Button>

            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-8 gap-1 rounded-lg px-2.5 text-xs"
              disabled={page >= totalPages}
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            >
              <span>التالي</span>
              <ChevronLeft className="size-3.5" />
            </Button>
          </div>
        </CardFooter>
      )}
    </Card>
  );
}
