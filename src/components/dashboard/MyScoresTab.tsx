import type { RecentScoreRow } from "@/types/database";
import {
  getScoreGrade,
  gradePillClassName,
} from "@/lib/student-quiz-ui";
import { ScoreRingBadge } from "@/components/ui/score-ring-badge";
import { cn } from "@/lib/utils";
import { BarChart3 } from "lucide-react";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button-variants";

interface MyScoresTabProps {
  scores: RecentScoreRow[];
}

export function MyScoresTab({ scores }: MyScoresTabProps) {
  if (scores.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-10 text-center">
        <BarChart3 className="mb-3 size-8 text-slate-300" />
        <p className="text-sm font-semibold text-slate-600">ما في نتائج بعد</p>
        <p className="mt-1 text-xs text-slate-500">
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

  return (
    <div className="space-y-3">
      <ul className="space-y-3">
        {scores.map((row) => {
          const grade = getScoreGrade(row.score);

          return (
            <li
              key={`${row.quizId}-${row.submittedAt}`}
              className="flex items-center justify-between gap-4 rounded-xl border border-slate-100 bg-slate-50/50 px-4 py-4"
            >
              <div className="min-w-0 flex-1 space-y-1">
                <span className="block text-start text-sm font-semibold text-slate-800">
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
              <ScoreRingBadge score={row.score} size="sm" />
            </li>
          );
        })}
      </ul>

      <div className="pt-2 text-center">
        <Link
          href="/results"
          className={cn(buttonVariants({ variant: "outline", size: "sm" }), "rounded-xl")}
        >
          عرض كل النتائج
        </Link>
      </div>
    </div>
  );
}
