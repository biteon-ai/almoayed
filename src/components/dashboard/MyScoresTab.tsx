import type { RecentScoreRow } from "@/types/database";
import { cn } from "@/lib/utils";
import { BarChart3 } from "lucide-react";

interface MyScoresTabProps {
  scores: RecentScoreRow[];
}

function scoreBadgeClass(score: number): string {
  if (score >= 80) {
    return "border border-green-100 bg-green-50 text-green-600";
  }
  if (score >= 50) {
    return "border border-amber-100 bg-amber-50 text-amber-700";
  }
  return "border border-red-100 bg-red-50 text-red-600";
}

export function MyScoresTab({ scores }: MyScoresTabProps) {
  if (scores.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-10 text-center">
        <BarChart3 className="mb-3 size-8 text-slate-300" />
        <p className="text-sm font-semibold text-slate-600">
          ما في نتائج بعد
        </p>
        <p className="mt-1 text-xs text-slate-500">حلّ أول اختبار وشوف نتيجتك هون!</p>
      </div>
    );
  }

  return (
    <div className="space-y-3 md:space-y-0">
      {/* Desktop header row */}
      <div className="hidden border-b border-slate-100 pb-2 text-xs font-bold text-slate-400 md:grid md:grid-cols-[1fr_auto] md:gap-4">
        <span className="text-start">اسم الاختبار</span>
        <span className="text-end">النتيجة</span>
      </div>

      <ul className="space-y-3 md:space-y-0 md:divide-y md:divide-slate-100">
        {scores.map((row) => (
          <li
            key={`${row.quizId}-${row.submittedAt}`}
            className={cn(
              "flex items-center justify-between gap-4",
              "rounded-xl border border-slate-100 bg-slate-50/50 px-4 py-4",
              "md:rounded-none md:border-0 md:bg-transparent md:px-0 md:py-3.5"
            )}
          >
            <span className="min-w-0 flex-1 text-start text-sm font-semibold text-slate-800 md:text-base">
              {row.quizTitle}
            </span>
            <span
              className={cn(
                "shrink-0 rounded-lg px-3 py-1 text-sm font-black tabular-nums",
                scoreBadgeClass(row.score)
              )}
            >
              {row.score}%
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
