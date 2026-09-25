import type { CategoryPerformance } from "@/types/database";
import { Badge } from "@/components/ui/badge";
import { Target } from "lucide-react";
import { cn } from "@/lib/utils";
import { SPEKIT, spekit } from "@/lib/spekit-targets";

interface WeakPointsTabProps {
  categories: CategoryPerformance[];
}

const WEAK_THRESHOLD = 50;
const STRONG_THRESHOLD = 80;

export function WeakPointsTab({ categories }: WeakPointsTabProps) {
  if (categories.length === 0) {
    return (
      <div
        className="flex flex-col items-center rounded-2xl border border-dashed border-slate-200 bg-slate-50/50 px-4 py-10 text-center dark:border-slate-700 dark:bg-slate-800/50"
        {...spekit(SPEKIT.weakPointsCard)}
      >
        <Target className="mb-3 size-8 text-brand-500/70" />
        <p className="text-sm font-bold text-slate-700 dark:text-white">
          تحليل مستوى المهارات
        </p>
        <p className="mt-2 max-w-xs text-xs leading-relaxed text-slate-500 dark:text-slate-400">
          حلّ أول اختبار إلك، ورح يظهر هون تحليل نقاط قوتك والأشياء اللي بدها
          مراجعة.
        </p>
      </div>
    );
  }

  return (
    <ul
      className="space-y-3 md:space-y-0 md:divide-y md:divide-slate-100 dark:md:divide-slate-700"
      {...spekit(SPEKIT.weakPointsCard)}
    >
      {categories.map((cat) => {
        const isWeak = cat.success_percentage < WEAK_THRESHOLD;
        const isStrong = cat.success_percentage >= STRONG_THRESHOLD;
        const pct = Math.round(cat.success_percentage);

        return (
          <li
            key={cat.category_tag}
            className={cn(
              "flex items-center justify-between gap-4",
              "rounded-xl border border-slate-100 bg-slate-50/50 px-4 py-4",
              "dark:border-slate-700 dark:bg-slate-800/70",
              "md:rounded-none md:border-0 md:bg-transparent md:px-0 md:py-3.5"
            )}
          >
            <span className="min-w-0 flex-1 text-start text-sm font-semibold text-slate-800 dark:text-white">
              {cat.category_tag}
            </span>
            <div className="flex shrink-0 items-center gap-2">
              <span
                className={cn(
                  "digit-box rounded-lg px-2.5 py-1 text-sm font-black",
                  isStrong &&
                    "border border-green-100 bg-green-50 text-green-600 dark:border-emerald-800/60 dark:bg-emerald-950/50 dark:text-emerald-300",
                  isWeak &&
                    "border border-red-100 bg-red-50 text-red-600 dark:border-rose-800/60 dark:bg-rose-950/50 dark:text-rose-300",
                  !isStrong &&
                    !isWeak &&
                    "border border-amber-100 bg-amber-50 text-amber-700 dark:border-amber-800/60 dark:bg-amber-950/50 dark:text-amber-300"
                )}
              >
                {pct}%
              </span>
              <Badge
                variant="outline"
                className={cn(
                  "text-[10px] font-bold",
                  isWeak &&
                    "border-red-100 bg-red-50/80 text-red-600 dark:border-rose-800/60 dark:bg-rose-950/40 dark:text-rose-300",
                  isStrong &&
                    "border-green-100 bg-green-50/80 text-green-600 dark:border-emerald-800/60 dark:bg-emerald-950/40 dark:text-emerald-300",
                  !isWeak &&
                    !isStrong &&
                    "border-slate-100 bg-slate-50 text-slate-600 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200"
                )}
              >
                {isWeak ? "ضعيف" : isStrong ? "قوي" : "متوسط"}
              </Badge>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
