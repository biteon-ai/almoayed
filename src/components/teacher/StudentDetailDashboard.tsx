"use client";

import Link from "next/link";
import {
  ArrowRight,
  Award,
  BookOpen,
  Crown,
  MessageCircle,
  Target,
  TrendingUp,
} from "lucide-react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/status-badge";
import { WeakPointsTab } from "@/components/dashboard/WeakPointsTab";
import { StudentOverviewSection } from "@/components/teacher/StudentOverviewSection";
import { cn } from "@/lib/utils";
import { SPEKIT } from "@/lib/spekit-targets";
import type { TeacherStudentDetail } from "@/types/database";

interface StudentDetailDashboardProps {
  detail: TeacherStudentDetail;
}

function whatsappHref(number: string): string {
  const digits = number.replace(/\D/g, "");
  return `https://wa.me/${digits}`;
}

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString("ar-SY", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return iso;
  }
}

function studentInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "؟";
  if (parts.length === 1) return parts[0]!.slice(0, 2);
  return `${parts[0]!.slice(0, 1)}${parts[1]!.slice(0, 1)}`;
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
          {entry.name}: {entry.value}%
        </p>
      ))}
    </div>
  );
}

export function StudentDetailDashboard({ detail }: StudentDetailDashboardProps) {
  const { student, analytics } = detail;
  const { kpis } = analytics;

  const scoreChartData = analytics.scoreHistory.map((point, index) => ({
    label: `#${index + 1}`,
    score: point.score,
    quizTitle: point.quizTitle,
  }));

  return (
    <div className="space-y-6" dir="rtl">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex min-w-0 items-start gap-4">
          <span
            aria-hidden
            className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-50 to-brand-100 text-base font-bold text-brand-800 ring-1 ring-brand-200/80 shadow-sm"
          >
            {studentInitials(student.fullName)}
          </span>
          <div className="min-w-0 space-y-2 text-start">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl font-bold tracking-tight sm:text-2xl">
                {student.fullName}
              </h1>
              {student.tier === "pro" ? (
                <Badge className="gap-1 rounded-full border-amber-200 bg-amber-50 text-amber-900">
                  <Crown className="size-3" />
                  Pro
                </Badge>
              ) : (
                <Badge variant="outline" className="rounded-full">
                  مجاني
                </Badge>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
              {student.createdAt ? (
                <span>انضم {formatDate(student.createdAt)}</span>
              ) : null}
              <span>·</span>
              <span>
                {student.groupNames.length
                  ? student.groupNames.join("، ")
                  : "بدون مجموعة"}
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <StatusBadge
                tone={
                  student.status === "active"
                    ? "active"
                    : student.status === "pending"
                      ? "pending"
                      : "deactivated"
                }
                className="h-6 gap-1 rounded-full px-2.5 text-[11px] font-bold"
              >
                {student.status === "active"
                  ? "نشط"
                  : student.status === "pending"
                    ? "معلق"
                    : "معطل"}
              </StatusBadge>
              <a
                href={whatsappHref(student.whatsappNumber)}
                target="_blank"
                rel="noopener noreferrer"
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-full border border-[#25D366]/25 bg-[#25D366]/5 px-2.5 py-1",
                  "font-mono text-xs font-medium text-foreground/80 transition-colors",
                  "hover:border-[#25D366]/50 hover:bg-[#25D366]/12 hover:text-foreground"
                )}
                dir="ltr"
              >
                <MessageCircle className="size-3.5 shrink-0 text-[#25D366]" />
                {student.whatsappNumber}
              </a>
            </div>
          </div>
        </div>

        <Link
          href="/teacher/students"
          className={cn(
            buttonVariants({ variant: "outline", size: "sm" }),
            "shrink-0 gap-1 rounded-xl"
          )}
          data-spekit={SPEKIT.studentDetailBackLink}
        >
          <ArrowRight className="size-4" />
          العودة للطلاب
        </Link>
      </div>

      <div
        className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4"
        data-spekit={SPEKIT.studentDetailKpis}
      >
        <Card className="rounded-2xl border shadow-sm">
          <CardContent className="space-y-1 p-5 text-start">
            <p className="text-xs font-medium text-muted-foreground">
              نسبة إكمال الاختبارات
            </p>
            <h3 className="text-2xl font-bold tabular-nums">
              {kpis.completionRate}%
            </h3>
            <p className="text-[11px] text-muted-foreground">
              {kpis.completedAttempts}/{kpis.totalAccessibleQuizzes} اختبار
            </p>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border shadow-sm">
          <CardContent className="flex items-center justify-between p-5">
            <div className="space-y-1 text-start">
              <p className="text-xs font-medium text-muted-foreground">
                نسبة النجاح
              </p>
              <h3 className="text-2xl font-bold tabular-nums">{kpis.passRate}%</h3>
              <p className="text-[11px] text-muted-foreground">
                {kpis.perfectScores} درجة كاملة
              </p>
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
                متوسط العلامات
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
            <div className="space-y-1 text-start">
              <p className="text-xs font-medium text-muted-foreground">
                المحاولات المسجّلة
              </p>
              <h3 className="text-2xl font-bold tabular-nums">
                {analytics.recentSubmissions.length > 0
                  ? analytics.scoreHistory.length
                  : 0}
              </h3>
              <p className="text-[11px] text-muted-foreground">
                آخر نشاط:{" "}
                {analytics.recentSubmissions[0]
                  ? formatDate(analytics.recentSubmissions[0].submittedAt)
                  : "—"}
              </p>
            </div>
            <div className="rounded-2xl bg-emerald-500/10 p-3 text-emerald-600">
              <BookOpen className="size-6" aria-hidden />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <Card
          className="space-y-4 rounded-2xl border p-5 shadow-sm lg:col-span-7"
          data-spekit={SPEKIT.studentDetailScoreChart}
        >
          <CardHeader className="p-0">
            <CardTitle className="text-base font-bold">
              تطور العلامات عبر المحاولات
            </CardTitle>
            <p className="text-xs text-muted-foreground">
              آخر {scoreChartData.length} محاولة مسجّلة
            </p>
          </CardHeader>
          <div className="h-[250px] w-full">
            {scoreChartData.length ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={scoreChartData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis
                    dataKey="label"
                    fontSize={11}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    domain={[0, 100]}
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip content={<ChartTooltip />} />
                  <Line
                    type="monotone"
                    dataKey="score"
                    name="العلامة"
                    stroke="#10b981"
                    strokeWidth={2}
                    dot={{ r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                لا توجد محاولات بعد
              </div>
            )}
          </div>
        </Card>

        <Card
          className="space-y-4 rounded-2xl border p-5 shadow-sm lg:col-span-5"
          data-spekit={SPEKIT.studentDetailWeakPoints}
        >
          <CardHeader className="p-0">
            <CardTitle className="flex items-center gap-2 text-base font-bold">
              <Target className="size-4 text-brand-600" aria-hidden />
              نقاط الضعف حسب الموضوع
            </CardTitle>
          </CardHeader>
          <WeakPointsTab categories={analytics.weakPoints} />
        </Card>
      </div>

      <StudentOverviewSection
        quizBreakdown={analytics.quizBreakdown}
        recentSubmissions={analytics.recentSubmissions}
      />
    </div>
  );
}
