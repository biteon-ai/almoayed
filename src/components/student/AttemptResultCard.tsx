"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import type { NumberedScoreRow } from "@/lib/student-quiz-ui";
import {
  getScoreGrade,
  gradePillClassName,
} from "@/lib/student-quiz-ui";
import {
  prefetchQuizRoute,
  quizPlayerHref,
} from "@/lib/quiz-route-prefetch";
import { usePrefetchOnIntent } from "@/hooks/use-prefetch-on-intent";
import { SPEKIT } from "@/lib/spekit-targets";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button-variants";
import { Card, CardContent } from "@/components/ui/card";
import { ScoreRingBadge } from "@/components/ui/score-ring-badge";
import { LocalDateTime } from "@/components/ui/local-datetime";
import { Calendar, Clock, Eye, RotateCcw } from "lucide-react";

type AttemptResultCardProps = {
  attempt: NumberedScoreRow;
  /** Highlight as the newest attempt overall or within a filter set. */
  showLatestBadge?: boolean;
};

export function AttemptResultCard({
  attempt,
  showLatestBadge = false,
}: AttemptResultCardProps) {
  const grade = getScoreGrade(attempt.score);
  const router = useRouter();
  const reviewHref = quizPlayerHref(attempt.quizId, {
    reviewSubmissionId: attempt.submissionId,
  });
  const retakeHref = quizPlayerHref(attempt.quizId);
  const { ref, intentProps } = usePrefetchOnIntent(reviewHref);

  return (
    <Card
      ref={ref}
      data-spekit={`${SPEKIT.resultsCard}-${attempt.submissionId}`}
      className="flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-sm transition-all duration-200 hover:shadow-md dark:border-slate-700 dark:bg-slate-900 dark:shadow-none dark:hover:shadow-none"
      {...intentProps}
    >
      <CardContent className="flex h-full flex-col gap-3 p-4 sm:gap-4 sm:p-5">
        <div className="flex items-center justify-between gap-3 sm:gap-4">
          <ScoreRingBadge
            score={attempt.score}
            size="md"
            className="shrink-0 self-center"
          />

          <div className="min-w-0 flex-1 space-y-1.5 text-start">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="line-clamp-2 text-sm font-extrabold leading-snug text-foreground sm:text-base">
                {attempt.quizTitle}
              </h3>
              <Badge
                variant="outline"
                className="rounded-full px-2 py-0 text-[10px] font-bold text-muted-foreground"
              >
                محاولة {attempt.attemptNumber}
                {attempt.attemptTotal > 1
                  ? ` من ${attempt.attemptTotal}`
                  : null}
              </Badge>
            </div>

            <div className="flex flex-wrap items-center gap-1.5">
              <Badge
                variant="outline"
                className="rounded-full border-emerald-200/80 bg-emerald-50/70 px-2 py-0 text-[11px] font-bold text-emerald-800 dark:border-emerald-800/50 dark:bg-emerald-950/40 dark:text-emerald-200"
              >
                {attempt.categoryName}
              </Badge>
              <Badge
                className={cn(
                  "rounded-full border px-2 py-0 text-[11px] font-semibold",
                  gradePillClassName(grade.tone)
                )}
              >
                {grade.label}
              </Badge>
              {showLatestBadge ? (
                <Badge
                  variant="outline"
                  className="rounded-full border-sky-200/80 bg-sky-50/70 px-2 py-0 text-[10px] font-bold text-sky-800 dark:border-sky-800/50 dark:bg-sky-950/40 dark:text-sky-200"
                >
                  أحدث محاولة
                </Badge>
              ) : null}
            </div>

            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-muted-foreground sm:text-xs">
              <span className="inline-flex min-w-0 items-center gap-1.5">
                <Calendar className="size-3.5 shrink-0" aria-hidden />
                <LocalDateTime iso={attempt.submittedAt} mode="date" />
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Clock className="size-3.5 shrink-0" aria-hidden />
                <LocalDateTime iso={attempt.submittedAt} mode="time" />
              </span>
            </div>
          </div>
        </div>

        <div className="mt-auto flex flex-col gap-2.5 border-t border-border/50 pt-3 dark:border-slate-700/80 min-[380px]:flex-row min-[380px]:gap-3">
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
      </CardContent>
    </Card>
  );
}
