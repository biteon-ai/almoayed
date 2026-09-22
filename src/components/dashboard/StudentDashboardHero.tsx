"use client";

import {
  StudentPageHero,
  StudentPageHeroBadge,
  studentPageHeroTitleClassName,
} from "@/components/student/StudentPageHero";
import { Progress } from "@/components/ui/progress";
import { SPEKIT } from "@/lib/spekit-targets";
import type { StudentGamification } from "@/lib/student-gamification";
import { Flame, Sparkles } from "lucide-react";

export interface StudentDashboardHeroProps {
  studentName: string;
  gamification: StudentGamification;
}

const DESKTOP_SUBTITLE = "أنت على بعد خطوة واحدة من هدفك!";

/**
 * Compact dashboard welcome hero — goal progress + streak (UI-019).
 */
export function StudentDashboardHero({
  studentName,
  gamification,
}: StudentDashboardHeroProps) {
  return (
    <StudentPageHero
      id="student-welcome"
      spekit={SPEKIT.studentWelcome}
      badge={
        <StudentPageHeroBadge>
          <Sparkles className="h-3 w-3 shrink-0 text-amber-300" />
          <span className="truncate">جاهز للتحدي اليوم؟</span>
        </StudentPageHeroBadge>
      }
      title={
        <h1 className={studentPageHeroTitleClassName()}>
          أهلاً بعودتك، {studentName}! 👋
        </h1>
      }
      subtitle={DESKTOP_SUBTITLE}
      belowTitle={
        <div className="min-w-0 space-y-0.5">
          <div className="flex min-w-0 items-center justify-between gap-2 text-[10px] font-semibold sm:text-[11px]">
            <span className="min-w-0 text-emerald-100/90">هدف اليوم</span>
            <span className="shrink-0 text-amber-200">
              {gamification.dailyGoalProgress === 100
                ? "مكتمل ✓"
                : "اختبار واحد على الأقل"}
            </span>
          </div>
          <Progress
            className="h-1 rounded-full bg-white/20 sm:h-1.5"
            value={gamification.dailyGoalProgress}
          />
        </div>
      }
    >
      <div className="flex w-full items-center gap-1.5 rounded-xl border border-white/20 bg-white/10 px-2 py-1.5 text-white shadow-inner backdrop-blur-md sm:w-auto sm:gap-2 sm:px-2.5 sm:py-2">
        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-amber-400/40 bg-amber-500/20">
          <Flame className="h-3.5 w-3.5 animate-pulse fill-amber-400 text-amber-400" />
        </div>
        <div className="min-w-0 leading-tight">
          <div className="flex items-baseline gap-1">
            <span className="text-sm font-black tabular-nums sm:text-base">
              {gamification.streakDays}
            </span>
            <span className="text-[10px] text-amber-200">أيام</span>
          </div>
          <p className="text-[10px] font-medium text-emerald-100">
            سلسلة المذاكرة 🔥
          </p>
        </div>
      </div>
    </StudentPageHero>
  );
}
