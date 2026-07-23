"use client";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { PaginationControls } from "@/components/ui/pagination-controls";
import { usePagination } from "@/hooks/usePagination";
import { SPEKIT } from "@/lib/spekit-targets";
import type { TeacherDashboardAnalytics } from "@/types/database";
import { Flame } from "lucide-react";

const ITEMS_PER_PAGE = 3;

type PopularExam = TeacherDashboardAnalytics["popularExams"][number];

interface PaginatedPopularExamsProps {
  popularExams?: PopularExam[];
}

export function PaginatedPopularExams({
  popularExams = [],
}: PaginatedPopularExamsProps) {
  const { items, page, totalPages, total, setPage } = usePagination(
    popularExams,
    ITEMS_PER_PAGE
  );
  const startIndex = (page - 1) * ITEMS_PER_PAGE;

  return (
    <Card
      className="flex h-full flex-col justify-between rounded-2xl border bg-card shadow-sm lg:col-span-5"
      data-spekit={SPEKIT.teacherPopularExamsPanel}
    >
      <div>
        <CardHeader className="border-b bg-muted/20 px-5 py-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <CardTitle className="flex items-center gap-2 text-base font-bold">
                <Flame
                  className="size-4 fill-amber-500/20 text-amber-500"
                  aria-hidden
                />
                <span>الاختبارات الأكثر حلاً ورواجاً</span>
              </CardTitle>
              <p className="mt-0.5 text-xs text-muted-foreground">
                ترتيب حسب عدد المحاولات
              </p>
            </div>
            <Badge
              variant="secondary"
              className="shrink-0 border-amber-200/50 bg-amber-500/10 text-xs font-semibold text-amber-700 dark:text-amber-300"
            >
              {total} اختبار
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="space-y-3 p-4">
          {total === 0 ? (
            <div className="py-10 text-center text-xs text-muted-foreground">
              لا توجد بيانات محاولات متاحة حالياً.
            </div>
          ) : (
            items.map((exam, idx) => {
              const actualRank = startIndex + idx + 1;

              return (
                <div
                  key={exam.rank}
                  className="group flex items-center justify-between gap-3 rounded-xl border border-muted/80 bg-background p-3.5 transition-all hover:border-emerald-500/30 hover:bg-muted/30"
                >
                  <div className="min-w-0 flex-1 space-y-1 text-start">
                    <div className="flex items-center gap-2">
                      <span className="rounded-md bg-emerald-500/10 px-2 py-0.5 text-xs font-extrabold text-emerald-600">
                        #{actualRank}
                      </span>
                      <span className="truncate text-sm font-bold text-foreground transition-colors group-hover:text-emerald-600">
                        {exam.title}
                      </span>
                    </div>
                    <p className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                      <span>إكمال {exam.completionRate}%</span>
                      <span aria-hidden>•</span>
                      <span>{exam.attempts} محاولة</span>
                    </p>
                  </div>

                  <Badge
                    variant="outline"
                    className="shrink-0 border-emerald-200/60 bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300"
                  >
                    {exam.attempts} محاولة
                  </Badge>
                </div>
              );
            })
          )}
        </CardContent>
      </div>

      {totalPages > 1 && (
        <CardFooter className="mt-auto border-t bg-muted/10 px-4 py-3">
          <PaginationControls
            page={page}
            totalPages={totalPages}
            total={total}
            pageSize={ITEMS_PER_PAGE}
            onPageChange={setPage}
            itemLabel="اختبار"
            variant="compact"
            className="w-full"
          />
        </CardFooter>
      )}
    </Card>
  );
}
