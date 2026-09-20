"use client";

import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { SPEKIT } from "@/lib/spekit-targets";
import type { StudentGamification } from "@/lib/student-gamification";
import { Flame, Sparkles } from "lucide-react";

export interface StudentDashboardHeroProps {
  studentName: string;
  gamification: StudentGamification;
}

/**
 * Gradient welcome banner with daily goal, streak, and quick navigation links.
 * Used on the student dashboard home screen.
 */
export function StudentDashboardHero({
  studentName,
  gamification,
}: StudentDashboardHeroProps) {
  return (
    <section
      id="student-welcome"
      className="scroll-mt-24 relative overflow-hidden rounded-3xl bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-800 p-6 text-white shadow-xl sm:p-8"
      data-spekit={SPEKIT.studentWelcome}
    >
      <div className="pointer-events-none absolute -left-12 -top-12 h-56 w-56 rounded-full bg-emerald-400/20 blur-3xl" />

      <div className="relative z-10 flex flex-col items-start justify-between gap-6 md:flex-row md:items-center">
        <div className="max-w-lg space-y-3">
          <Badge className="gap-1 rounded-full border-white/20 bg-white/15 px-3 py-1 text-xs text-white backdrop-blur-md">
            <Sparkles className="h-3.5 w-3.5 text-amber-300" />
            <span>جاهز للتحدي اليوم؟</span>
          </Badge>

          <h1 className="text-2xl font-black tracking-tight sm:text-3xl">
            أهلاً بعودتك، {studentName}! 👋
          </h1>

          <p className="text-sm leading-relaxed text-emerald-100/90">
            استمر في إنجاز الاختبارات اليومية ورفع معدلك العام. أنت على بعد خطوة
            واحدة من هدفك!
          </p>

          <div className="space-y-2 pt-1">
            <div className="flex items-center justify-between text-xs font-semibold">
              <span className="text-emerald-100/90">هدف اليوم</span>
              <span className="text-amber-200">
                {gamification.dailyGoalProgress === 100
                  ? "مكتمل ✓"
                  : "اختبار واحد على الأقل"}
              </span>
            </div>
            <Progress
              className="h-2 rounded-full bg-white/20"
              value={gamification.dailyGoalProgress}
            />
          </div>
        </div>

        <div className="flex items-center justify-between gap-4 self-stretch rounded-2xl border border-white/20 bg-white/10 p-4 text-white shadow-inner backdrop-blur-md sm:self-auto sm:justify-start">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-amber-400/40 bg-amber-500/20">
            <Flame className="h-7 w-7 animate-pulse fill-amber-400 text-amber-400" />
          </div>
          <div>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-black">
                {gamification.streakDays}
              </span>
              <span className="text-xs text-amber-200">أيام</span>
            </div>
            <p className="text-xs font-medium text-emerald-100">
              سلسلة المذاكرة المتتالية 🔥
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
