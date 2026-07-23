"use client";

import Link from "next/link";
import {
  Award,
  AlertTriangle,
  BarChart3,
  BookOpen,
  CheckCircle2,
  Crown,
  Flame,
  TrendingDown,
  TrendingUp,
  Users,
} from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardTitle } from "@/components/ui/card";
import { PaginatedPopularExams } from "@/components/teacher/PaginatedPopularExams";
import { StatCard } from "@/components/teacher/StatCard";
import { cn } from "@/lib/utils";
import { SPEKIT } from "@/lib/spekit-targets";
import type { TeacherDashboardAnalytics } from "@/types/database";

interface TeacherDashboardAnalyticsProps {
  teacherName: string;
  schoolName?: string | null;
  analytics: TeacherDashboardAnalytics;
}

function CompletionRing({ value }: { value: number }) {
  const clamped = Math.min(100, Math.max(0, value));
  const radius = 22;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (clamped / 100) * circumference;

  return (
    <div className="relative flex size-14 items-center justify-center">
      <svg className="size-14 -rotate-90" viewBox="0 0 56 56" aria-hidden>
        <circle
          cx="28"
          cy="28"
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth="5"
          className="text-emerald-100"
        />
        <circle
          cx="28"
          cy="28"
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth="5"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="text-emerald-600 transition-all duration-500"
        />
      </svg>
      <span className="absolute text-[10px] font-bold tabular-nums text-emerald-700">
        {clamped}%
      </span>
    </div>
  );
}

function TrendBadge({ value }: { value: number }) {
  const positive = value >= 0;
  const Icon = positive ? TrendingUp : TrendingDown;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-0.5 text-[11px] font-semibold",
        positive ? "text-emerald-600" : "text-amber-600"
      )}
    >
      <Icon className="size-3" aria-hidden />
      {positive ? "+" : ""}
      {value}% هذا الأسبوع
    </span>
  );
}

function ChartTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ value?: number; name?: string; color?: string }>;
  label?: string;
}) {
  if (!active || !payload?.length) return null;

  return (
    <div className="rounded-xl border bg-background px-3 py-2 text-xs shadow-md">
      <p className="mb-1 font-semibold">{label}</p>
      {payload.map((entry) => (
        <p key={entry.name} style={{ color: entry.color }}>
          {entry.name}: {entry.value}
        </p>
      ))}
    </div>
  );
}

export function TeacherDashboardAnalytics({
  teacherName,
  schoolName,
  analytics,
}: TeacherDashboardAnalyticsProps) {
  const { kpis } = analytics;

  return (
    <div className="space-y-6">
      <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div className="text-start">
          <h1 className="text-2xl font-bold tracking-tight">
            أهلاً أستاذ {teacherName} 👋
          </h1>
          <p className="mt-1 text-xs text-muted-foreground sm:text-sm">
            {schoolName ||
              "إليك نظرة عامة على أداء الطلاب وتحليلات الاختبارات لهذا الأسبوع."}
          </p>
        </div>
        <div
          className="flex flex-wrap items-center gap-2"
          data-spekit={SPEKIT.teacherQuickActions}
        >
          <Link
            href="/teacher/quizzes"
            className={cn(
              buttonVariants({ size: "default" }),
              "rounded-xl bg-emerald-600 text-sm text-white hover:bg-emerald-700"
            )}
          >
            إدارة الاختبارات
          </Link>
          <Link
            href="/teacher/students"
            className={cn(
              buttonVariants({ variant: "outline", size: "default" }),
              "rounded-xl text-sm"
            )}
          >
            إدارة الطلاب
          </Link>
        </div>
      </div>

      <div
        className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4"
        data-spekit={SPEKIT.teacherAnalyticsKpis}
      >
        <Card className="rounded-2xl border shadow-sm">
          <CardContent className="flex items-center justify-between p-5">
            <div className="space-y-1 text-start">
              <p className="text-xs font-medium text-muted-foreground">
                نسبة التفاعل وإكمال الاختبارات
              </p>
              <h3 className="text-2xl font-bold tabular-nums">
                {kpis.completionRate}%
              </h3>
              <p className="text-[11px] text-muted-foreground">
                {kpis.completedAttempts}/{kpis.totalAttempts} محاولة مكملة
              </p>
              <TrendBadge value={kpis.completionTrendPct} />
            </div>
            <CompletionRing value={kpis.completionRate} />
          </CardContent>
        </Card>

        <Card className="rounded-2xl border shadow-sm">
          <CardContent className="flex items-center justify-between p-5">
            <div className="space-y-1 text-start">
              <p className="text-xs font-medium text-muted-foreground">
                نسبة النجاح العامة
              </p>
              <h3 className="text-2xl font-bold tabular-nums">
                {kpis.passRate}%
              </h3>
              <p className="text-[11px] text-muted-foreground">
                نسبة التفوق 100%: {kpis.perfectScoreStudentPct}% من الطلاب
              </p>
              <span className="text-[11px] font-semibold text-emerald-600">
                {kpis.perfectScoreStudentCount} طالب بدرجة كاملة
              </span>
            </div>
            <div className="rounded-2xl bg-blue-500/10 p-3 text-blue-600">
              <Award className="size-6" aria-hidden />
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border shadow-sm">
          <CardContent className="flex items-center justify-between p-5">
            <div className="space-y-1 text-start">
              <p className="text-xs font-medium text-muted-foreground">
                متوسط العلامات العامة
              </p>
              <h3 className="text-2xl font-bold tabular-nums">
                {kpis.averageScore} / 100
              </h3>
              <Badge
                variant="secondary"
                className="bg-emerald-100 text-[10px] text-emerald-800"
              >
                {kpis.averageScoreLabel}
              </Badge>
            </div>
            <div className="rounded-2xl bg-purple-500/10 p-3 text-purple-600">
              <TrendingUp className="size-6" aria-hidden />
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border shadow-sm">
          <CardContent className="flex items-center justify-between p-5">
            <div className="min-w-0 space-y-1 text-start">
              <p className="text-xs font-medium text-muted-foreground">
                أعلى طالب إنجازاً
              </p>
              {kpis.topPerformer ? (
                <>
                  <h3 className="truncate text-base font-bold">
                    {kpis.topPerformer.name}
                  </h3>
                  <span className="flex items-center gap-1 text-[11px] font-semibold text-amber-600">
                    👑 المعدل: {kpis.topPerformer.averageScore}%
                  </span>
                </>
              ) : (
                <p className="text-sm text-muted-foreground">
                  لا توجد محاولات بعد
                </p>
              )}
            </div>
            <div className="rounded-2xl bg-amber-500/10 p-3 text-amber-600">
              <Flame className="size-6" aria-hidden />
            </div>
          </CardContent>
        </Card>
      </div>

      <div
        className="grid grid-cols-1 gap-4 sm:grid-cols-3"
        data-spekit={SPEKIT.teacherStatsGrid}
      >
        <StatCard
          label="الطلاب"
          value={analytics.studentCount}
          icon={Users}
          spekitId={SPEKIT.teacherStatStudents}
        />
        <StatCard
          label="الاختبارات"
          value={analytics.quizCount}
          icon={BookOpen}
          spekitId={SPEKIT.teacherStatQuizzes}
        />
        <StatCard
          label="طلبات Pro"
          value={analytics.pendingUpgrades}
          icon={Crown}
          valueClassName="text-amber-600"
          spekitId={SPEKIT.teacherStatProRequests}
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <Card
          className="space-y-4 rounded-2xl border p-5 shadow-sm lg:col-span-7"
          data-spekit={SPEKIT.teacherGradeDistributionChart}
        >
          <div className="flex items-center justify-between">
            <div className="text-start">
              <CardTitle className="text-base font-bold">
                توزيع أداء الطلاب حسب الدرجات
              </CardTitle>
              <p className="text-xs text-muted-foreground">
                عدد الطلاب في كل فئة تقييم
              </p>
            </div>
            <BarChart3 className="size-5 text-muted-foreground" aria-hidden />
          </div>
          <div className="h-[250px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={analytics.gradeDistribution}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis
                  dataKey="range"
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  allowDecimals={false}
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip content={<ChartTooltip />} />
                <Bar dataKey="count" radius={[8, 8, 0, 0]}>
                  {analytics.gradeDistribution.map((entry) => (
                    <Cell key={entry.range} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card
          className="space-y-4 rounded-2xl border p-5 shadow-sm lg:col-span-5"
          data-spekit={SPEKIT.teacherExamDifficultyPanel}
        >
          <CardTitle className="flex items-center gap-2 text-base font-bold">
            <AlertTriangle className="size-4 text-amber-500" aria-hidden />
            <span>أصعب وأسهل الاختبارات</span>
          </CardTitle>

          <div className="space-y-3">
            {analytics.examDifficulty.hardest ? (
              <div className="space-y-2 rounded-xl border border-red-200 bg-red-50/50 p-3 dark:bg-red-950/20">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-bold text-red-700 dark:text-red-400">
                    الأكثر صعوبة 🔥
                  </span>
                  <Badge variant="destructive" className="text-[10px]">
                    يحتاج مراجعة
                  </Badge>
                </div>
                <p className="text-sm font-semibold">
                  {analytics.examDifficulty.hardest.title}
                </p>
                <p className="text-xs text-muted-foreground">
                  متوسط الدرجات: {analytics.examDifficulty.hardest.avgScore}% |
                  نسبة النجاح: {analytics.examDifficulty.hardest.passRate}%
                </p>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                لا توجد بيانات كافية لتحليل الصعوبة.
              </p>
            )}

            {analytics.examDifficulty.easiest ? (
              <div className="space-y-2 rounded-xl border border-emerald-200 bg-emerald-50/50 p-3 dark:bg-emerald-950/20">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400">
                    الأعلى نجاحاً ✨
                  </span>
                  <Badge className="bg-emerald-600 text-[10px] text-white hover:bg-emerald-600">
                    متقن
                  </Badge>
                </div>
                <p className="text-sm font-semibold">
                  {analytics.examDifficulty.easiest.title}
                </p>
                <p className="text-xs text-muted-foreground">
                  متوسط الدرجات: {analytics.examDifficulty.easiest.avgScore}% |
                  نسبة النجاح: {analytics.examDifficulty.easiest.passRate}%
                </p>
              </div>
            ) : null}
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <Card
          className="space-y-4 rounded-2xl border p-5 shadow-sm lg:col-span-7"
          data-spekit={SPEKIT.teacherWeeklyActivityChart}
        >
          <div className="flex items-center justify-between">
            <div className="text-start">
              <CardTitle className="text-base font-bold">
                نشاط تقديم الاختبارات الأسبوعي
              </CardTitle>
              <p className="text-xs text-muted-foreground">
                محاولات ناجحة مقابل غير مكتملة / رسوب
              </p>
            </div>
            <CheckCircle2 className="size-5 text-muted-foreground" aria-hidden />
          </div>
          <div className="h-[250px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={analytics.weeklyActivity}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis
                  dataKey="day"
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  allowDecimals={false}
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip content={<ChartTooltip />} />
                <Line
                  type="monotone"
                  dataKey="passed"
                  name="محاولات ناجحة"
                  stroke="#10b981"
                  strokeWidth={2}
                  dot={{ r: 3 }}
                />
                <Line
                  type="monotone"
                  dataKey="failed"
                  name="محاولات غير مكتملة / رسوب"
                  stroke="#f97316"
                  strokeWidth={2}
                  dot={{ r: 3 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <PaginatedPopularExams popularExams={analytics.popularExams} />
      </div>
    </div>
  );
}
