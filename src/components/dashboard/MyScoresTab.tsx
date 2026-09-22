import type { RecentScoreRow } from "@/types/database";
import {
  getScoreGrade,
  gradePillClassName,
  STUDENT_DASHBOARD_RECENT_SCORES_LIMIT,
} from "@/lib/student-quiz-ui";
import { ScoreRingBadge } from "@/components/ui/score-ring-badge";
import { cn } from "@/lib/utils";
import { ArrowLeft, BarChart3 } from "lucide-react";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button-variants";

interface MyScoresTabProps {
  scores: RecentScoreRow[];
}

export function MyScoresTab({ scores }: MyScoresTabProps) {
  if (scores.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-center sm:py-10">
        <BarChart3 className="mb-3 size-8 text-slate-300 dark:text-slate-500" />
        <p className="text-sm font-semibold text-slate-600 dark:text-slate-100">
          ما في نتائج بعد
        </p>
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
          حلّ أول اختبار وشوف نتيجتك هون!
        </p>
        <Link
          href="/quizzes"
          className={cn(buttonVariants({ size: "sm" }), "mt-4 rounded-xl")}
        >
          ابدأ أول اختبار
        </Link>
      </div>
    );
  }

  const previewScores = scores.slice(0, STUDENT_DASHBOARD_RECENT_SCORES_LIMIT);

  return (
    <div className="space-y-2.5 sm:space-y-3">
      <ul className="space-y-2 sm:space-y-3">
        {previewScores.map((row) => {
          const grade = getScoreGrade(row.score);

          return (
            <li
              key={`${row.quizId}-${row.submittedAt}`}
              className="flex items-center justify-between gap-3 rounded-xl border border-slate-100 bg-slate-50/50 px-3 py-2.5 dark:border-slate-700 dark:bg-slate-800/70 sm:gap-4 sm:px-4 sm:py-3.5"
            >
              <ScoreRingBadge
                score={row.score}
                size="sm"
                className="shrink-0 self-center"
              />
              <div className="min-w-0 flex-1 space-y-1 text-start">
                <span className="block text-sm font-semibold leading-snug text-slate-800 dark:text-white">
                  {row.quizTitle}
                </span>
                <span
                  className={cn(
                    "inline-flex rounded-full border px-2 py-0.5 text-[10px] font-semibold",
                    gradePillClassName(grade.tone)
                  )}
                >
                  {grade.label} {grade.emoji}
                </span>
              </div>
            </li>
          );
        })}
      </ul>

      <Link
        href="/results"
        className={cn(
          buttonVariants({ variant: "outline", size: "sm" }),
          "flex h-10 w-full items-center justify-center gap-1.5 rounded-xl border-brand-200 bg-brand-50/60 text-sm font-bold text-brand-800",
          "hover:bg-brand-50 hover:text-brand-900 dark:border-brand-800/50 dark:bg-brand-950/30 dark:text-brand-100"
        )}
      >
        <span>عرض كل النتائج</span>
        <ArrowLeft className="size-4 shrink-0 opacity-80" aria-hidden />
      </Link>
    </div>
  );
}
