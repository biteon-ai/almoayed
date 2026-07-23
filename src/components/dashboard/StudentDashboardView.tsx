"use client";

import type {
  CategoryPerformance,
  DashboardStats,
  RecentScoreRow,
  StudentTeacherOption,
} from "@/types/database";
import type { StudentGamification } from "@/lib/student-gamification";
import type { TeacherGamificationStatus } from "@/lib/teacher-gamification";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StudentDashboardActiveQuizSection } from "@/components/dashboard/StudentDashboardActiveQuizSection";
import { StudentDashboardHero } from "@/components/dashboard/StudentDashboardHero";
import { StudentDashboardStatsRow } from "@/components/dashboard/StudentDashboardStatsRow";
import { LevelProgressCard } from "@/components/dashboard/LevelProgressCard";
import { BadgeGallery } from "@/components/dashboard/BadgeGallery";
import { DashboardTabs } from "@/components/dashboard/DashboardTabs";
import { PendingSyncBadge } from "@/components/quiz/PendingSyncBadge";
import { SPEKIT } from "@/lib/spekit-targets";
import { cn } from "@/lib/utils";
import {
  Award,
  Flame,
  Target,
  Trophy,
} from "lucide-react";
import type { StudentAchievement } from "@/lib/student-gamification";

export interface StudentDashboardViewProps {
  studentName: string;
  stats: DashboardStats;
  gamification: StudentGamification;
  teacherGamification: TeacherGamificationStatus | null;
  recentScores: RecentScoreRow[];
  weakPoints: CategoryPerformance[];
  teachers: StudentTeacherOption[];
  currentTeacherId: string | null;
}

function AchievementIcon({ icon }: { icon: StudentAchievement["icon"] }) {
  const className = "w-5 h-5";

  switch (icon) {
    case "flame":
      return <Flame className={cn(className, "fill-amber-500")} />;
    case "award":
      return <Award className={className} />;
    case "trophy":
      return <Trophy className={className} />;
    case "target":
      return <Target className={className} />;
  }
}

/**
 * Student home dashboard — hero, KPIs, continue-learning card, achievements, and tabbed scores.
 * Data is fetched server-side in `app/(student)/dashboard/page.tsx`.
 */
export function StudentDashboardView({
  studentName,
  stats,
  gamification,
  teacherGamification,
  recentScores,
  weakPoints,
  teachers,
  currentTeacherId,
}: StudentDashboardViewProps) {
  const { continueQuiz, continueProgress } = gamification;
  const earnedAchievements = gamification.achievements.filter(
    (achievement) => achievement.earned
  );
  const visibleAchievements =
    earnedAchievements.length > 0
      ? earnedAchievements
      : gamification.achievements.slice(0, 2);

  return (
    <div
      className="container mx-auto max-w-7xl space-y-6 p-4 sm:p-6"
      data-spekit={SPEKIT.studentDashboard}
    >
      <PendingSyncBadge />
      <StudentDashboardHero studentName={studentName} gamification={gamification} />

      <StudentDashboardStatsRow stats={stats} gamification={gamification} />

      {teacherGamification ? (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          <div className="lg:col-span-7">
            <LevelProgressCard status={teacherGamification} />
          </div>
          <div className="lg:col-span-5">
            <BadgeGallery status={teacherGamification} />
          </div>
        </div>
      ) : null}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <div className="lg:col-span-7">
          <StudentDashboardActiveQuizSection
            continueQuiz={continueQuiz}
            continueProgress={continueProgress}
          />
        </div>

        <Card className="rounded-2xl border bg-card shadow-xs lg:col-span-5">
          <CardHeader className="border-b bg-muted/20 px-6 py-4">
            <CardTitle className="flex items-center gap-2 text-base font-bold">
              <Trophy className="h-4 w-4 text-amber-500" />
              <span>وسامات وإنجازات</span>
            </CardTitle>
          </CardHeader>

          <CardContent className="space-y-3 p-5">
            {visibleAchievements.map((achievement) => (
              <div
                key={achievement.id}
                className={cn(
                  "flex items-center gap-3.5 rounded-xl border p-3",
                  achievement.earned
                    ? "bg-muted/20"
                    : "border-dashed bg-muted/10 opacity-70"
                )}
              >
                <div
                  className={cn(
                    "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl",
                    achievement.earned
                      ? "bg-amber-500/15 text-amber-600"
                      : "bg-muted text-muted-foreground"
                  )}
                >
                  <AchievementIcon icon={achievement.icon} />
                </div>
                <div className="space-y-0.5">
                  <h4 className="text-xs font-bold text-foreground">
                    {achievement.title}
                    {!achievement.earned && (
                      <span className="ms-1 text-[10px] font-normal text-muted-foreground">
                        (قريباً)
                      </span>
                    )}
                  </h4>
                  <p className="text-[11px] text-muted-foreground">
                    {achievement.description}
                  </p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <DashboardTabs
        recentScores={recentScores}
        weakPoints={weakPoints}
        teachers={teachers}
        currentTeacherId={currentTeacherId}
      />
    </div>
  );
}
