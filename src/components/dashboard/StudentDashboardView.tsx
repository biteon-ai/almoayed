"use client";

import Link from "next/link";
import type {
  CategoryPerformance,
  DashboardStats,
  QuizCarouselItem,
  RecentScoreRow,
  StudentTeacherOption,
} from "@/types/database";
import type {
  StudentAchievement,
  StudentGamification,
} from "@/lib/student-gamification";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { QuizCarousel } from "@/components/dashboard/QuizCarousel";
import { DashboardTabs } from "@/components/dashboard/DashboardTabs";
import { SPEKIT } from "@/lib/spekit-targets";
import { cn } from "@/lib/utils";
import {
  Flame,
  Trophy,
  Target,
  Sparkles,
  ArrowLeft,
  Play,
  CheckCircle2,
  TrendingUp,
  Crown,
  BookOpen,
  Award,
  ListChecks,
} from "lucide-react";

interface StudentDashboardViewProps {
  studentName: string;
  stats: DashboardStats;
  gamification: StudentGamification;
  quizzes: QuizCarouselItem[];
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

export function StudentDashboardView({
  studentName,
  stats,
  gamification,
  quizzes,
  recentScores,
  weakPoints,
  teachers,
  currentTeacherId,
}: StudentDashboardViewProps) {
  const isPro = stats.tier === "pro";
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
      {/* Hero welcome & streak */}
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
              استمر في إنجاز الاختبارات اليومية ورفع معدلك العام. أنت على بعد
              خطوة واحدة من هدفك!
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

            <div className="flex flex-wrap gap-2 pt-1">
              <Link
                href="/quizzes"
                className={cn(
                  buttonVariants({ size: "sm" }),
                  "rounded-xl bg-white/15 font-bold text-white hover:bg-white/25"
                )}
              >
                <BookOpen className="h-4 w-4" />
                ابدأ اختباراً
              </Link>
              <Link
                href="/results"
                className={cn(
                  buttonVariants({ size: "sm", variant: "outline" }),
                  "rounded-xl border-white/30 bg-transparent font-bold text-white hover:bg-white/10 hover:text-white"
                )}
              >
                <ListChecks className="h-4 w-4" />
                نتائجي
              </Link>
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

      {/* KPI cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card className="group rounded-2xl border bg-card shadow-xs transition-all hover:border-emerald-500/40">
          <CardContent className="flex items-center justify-between p-5">
            <div className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground">
                اختبارات مكتملة
              </p>
              <div className="flex items-baseline gap-2">
                <h3 className="text-3xl font-black text-foreground">
                  {stats.completedQuizCount}
                </h3>
                {gamification.completedThisWeek > 0 && (
                  <span className="flex items-center gap-0.5 text-xs font-bold text-emerald-600">
                    <CheckCircle2 className="h-3.5 w-3.5" />+
                    {gamification.completedThisWeek} هذا الأسبوع
                  </span>
                )}
              </div>
            </div>
            <div className="rounded-2xl bg-emerald-500/10 p-3.5 text-emerald-600 transition-transform group-hover:scale-110">
              <BookOpen className="h-6 w-6" />
            </div>
          </CardContent>
        </Card>

        <Card className="group rounded-2xl border bg-card shadow-xs transition-all hover:border-teal-500/40">
          <CardContent className="flex items-center justify-between p-5">
            <div className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground">
                المعدل العام
              </p>
              <div className="flex items-baseline gap-2">
                <h3 className="text-3xl font-black text-foreground">
                  {stats.overallAverageScore}%
                </h3>
                {gamification.scoreTrendPercent !== null &&
                  gamification.scoreTrendPercent !== 0 && (
                    <span
                      className={cn(
                        "flex items-center gap-0.5 text-xs font-bold",
                        gamification.scoreTrendPercent > 0
                          ? "text-emerald-600"
                          : "text-rose-600"
                      )}
                    >
                      <TrendingUp className="h-3.5 w-3.5" />
                      {gamification.scoreTrendPercent > 0 ? "+" : ""}
                      {gamification.scoreTrendPercent}%
                    </span>
                  )}
              </div>
            </div>
            <div className="rounded-2xl bg-teal-500/10 p-3.5 text-teal-600 transition-transform group-hover:scale-110">
              <Target className="h-6 w-6" />
            </div>
          </CardContent>
        </Card>

        <Card className="group rounded-2xl border border-amber-200/70 bg-gradient-to-br from-amber-50/40 to-yellow-50/20 shadow-xs transition-all hover:border-amber-500/50 dark:border-amber-800/50 dark:from-amber-950/20 dark:to-background">
          <CardContent className="flex items-center justify-between p-5">
            <div className="space-y-1">
              <p className="text-xs font-semibold text-amber-800 dark:text-amber-300">
                مستوى الاشتراك
              </p>
              <h3 className="text-2xl font-black text-amber-900 dark:text-amber-200">
                {isPro ? "باقة Pro 👑" : "مجاني"}
              </h3>
            </div>
            <div className="rounded-2xl bg-amber-500/15 p-3.5 text-amber-600 transition-transform group-hover:rotate-12">
              <Crown className="h-6 w-6 fill-amber-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Continue learning & achievements */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <Card className="relative flex flex-col justify-between overflow-hidden rounded-2xl border bg-card shadow-xs lg:col-span-7">
          <CardHeader className="border-b bg-muted/20 px-6 py-4">
            <div className="flex items-center justify-between gap-3">
              <CardTitle className="flex items-center gap-2 text-base font-bold">
                <Play className="h-4 w-4 fill-emerald-600/20 text-emerald-600" />
                <span>تابع من حيث توقفت</span>
              </CardTitle>
              {continueQuiz && (
                <Badge className="border-amber-200 bg-amber-500/10 text-xs font-semibold text-amber-700 dark:text-amber-300">
                  {continueQuiz.hasSubmission ? "للمراجعة" : "قيد التقدم"} (
                  {continueProgress}%)
                </Badge>
              )}
            </div>
          </CardHeader>

          <CardContent className="space-y-5 p-6">
            {continueQuiz ? (
              <>
                <div className="space-y-2">
                  <h3 className="text-xl font-bold text-foreground">
                    {continueQuiz.title}
                  </h3>
                  <p className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span>
                      {continueQuiz.questionCount}{" "}
                      {continueQuiz.questionCount === 1 ? "سؤال" : "أسئلة"}
                    </span>
                    <span>•</span>
                    <span>
                      {continueQuiz.is_free ? "متاح للجميع" : "اختبار Pro"}
                    </span>
                  </p>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="text-muted-foreground">نسبة الإنجاز</span>
                    <span className="font-bold text-emerald-600">
                      {continueProgress}%
                    </span>
                  </div>
                  <Progress
                    className="h-2.5 rounded-full bg-emerald-100 dark:bg-emerald-950"
                    value={continueProgress}
                  />
                </div>

                <Link
                  href={`/quiz/${continueQuiz.id}`}
                  className={cn(
                    buttonVariants({ size: "lg" }),
                    "h-11 w-full gap-2 rounded-xl bg-emerald-600 text-sm font-bold text-white shadow-md transition-all hover:bg-emerald-700"
                  )}
                >
                  <span>
                    {continueQuiz.hasSubmission
                      ? "مراجعة الاختبار"
                      : "متابعة الاختبار الآن"}
                  </span>
                  <ArrowLeft className="h-4 w-4" />
                </Link>
              </>
            ) : (
              <div className="space-y-4 py-4 text-center">
                <p className="text-sm font-semibold text-muted-foreground">
                  لا يوجد اختبار نشط حالياً
                </p>
                <Link
                  href="/quizzes"
                  className={cn(
                    buttonVariants({ size: "lg" }),
                    "h-11 gap-2 rounded-xl bg-emerald-600 font-bold hover:bg-emerald-700"
                  )}
                >
                  <span>استكشف الاختبارات المتاحة</span>
                  <ArrowLeft className="h-4 w-4" />
                </Link>
              </div>
            )}
          </CardContent>
        </Card>

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

      <QuizCarousel quizzes={quizzes} />

      <DashboardTabs
        recentScores={recentScores}
        weakPoints={weakPoints}
        teachers={teachers}
        currentTeacherId={currentTeacherId}
      />
    </div>
  );
}
