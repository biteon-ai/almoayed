"use client";

import Link from "next/link";
import {
  BookOpen,
  CalendarCheck,
  Flame,
  ListChecks,
} from "lucide-react";
import type { StudentGamification } from "@/lib/student-gamification";
import {
  dashboardActionTileHint,
  dashboardActionTileHref,
  type DashboardActionTileId,
} from "@/lib/dashboard-action-tiles";
import { SPEKIT } from "@/lib/spekit-targets";
import { cn } from "@/lib/utils";

const TILES: {
  id: DashboardActionTileId;
  title: string;
  icon: typeof Flame;
  spekit: string;
}[] = [
  {
    id: "progress",
    title: "تقدّم اليوم",
    icon: Flame,
    spekit: SPEKIT.dashboardTileProgress,
  },
  {
    id: "quizzes",
    title: "اختبارات تفاعلية",
    icon: BookOpen,
    spekit: SPEKIT.dashboardTileQuizzes,
  },
  {
    id: "results",
    title: "ملخص نتائجي",
    icon: ListChecks,
    spekit: SPEKIT.dashboardTileResults,
  },
  {
    id: "continue",
    title: "أكمل دراستك",
    icon: CalendarCheck,
    spekit: SPEKIT.dashboardTileContinue,
  },
];

export function DashboardActionTiles({
  gamification,
  lastScore,
}: {
  gamification: StudentGamification;
  lastScore: number | null;
}) {
  const continueQuizId = gamification.continueQuiz?.id ?? null;

  return (
    <section
      data-spekit={SPEKIT.dashboardActionTiles}
      className="grid grid-cols-2 gap-3"
      aria-label="اختصارات الدراسة"
    >
      {TILES.map((tile) => {
        const Icon = tile.icon;
        const href = dashboardActionTileHref(tile.id, continueQuizId);
        const hint = dashboardActionTileHint({
          id: tile.id,
          streakDays: gamification.streakDays,
          dailyGoalProgress: gamification.dailyGoalProgress,
          lastScore,
          continueTitle: gamification.continueQuiz?.title ?? null,
        });

        return (
          <Link
            key={tile.id}
            href={href}
            data-spekit={tile.spekit}
            className={cn(
              "flex min-h-24 flex-col justify-between gap-3 rounded-2xl border border-border/80",
              "bg-card p-5 shadow-sm transition-transform active:scale-[0.99]",
              "hover:border-brand-400/50 hover:shadow-md"
            )}
          >
            <span className="flex size-10 items-center justify-center rounded-xl bg-brand-500/10 text-brand-700 dark:text-brand-300">
              <Icon className="size-5" aria-hidden />
            </span>
            <span>
              <span className="block text-sm font-black text-foreground">
                {tile.title}
              </span>
              <span className="mt-0.5 line-clamp-2 text-[11px] font-medium leading-snug text-muted-foreground">
                {hint}
              </span>
            </span>
          </Link>
        );
      })}
    </section>
  );
}
