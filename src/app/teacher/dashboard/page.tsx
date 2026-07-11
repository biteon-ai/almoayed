import Link from "next/link";
import { getTeacherProfile, getTeacherStats } from "@/actions/teacher";
import { requireTeacher } from "@/lib/auth";
import { StatCard } from "@/components/teacher/StatCard";
import { Card, CardContent } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { Users, BookOpen, Crown } from "lucide-react";
import { cn } from "@/lib/utils";
import { SPEKIT } from "@/lib/spekit-targets";

export const metadata = { title: "لوحة الأستاذ | المؤيد" };

export default async function TeacherDashboardPage() {
  const session = await requireTeacher();
  const [profile, stats] = await Promise.all([
    getTeacherProfile(),
    getTeacherStats(),
  ]);

  return (
    <div
      className="mx-auto w-full max-w-6xl space-y-6"
      data-spekit={SPEKIT.teacherDashboard}
    >
      <div className="text-start">
        <h1 className="text-2xl font-bold tracking-tight">
          أهلاً أستاذ {session.fullName} 👋
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {profile?.school_name || "إدارة طلابك واختباراتك من مكان واحد"}
        </p>
      </div>

      {profile?.teacher_code && (
        <Card
          className="border-brand-200/80 bg-brand-50/40 shadow-sm"
          data-spekit={SPEKIT.teacherCodeCard}
        >
          <CardContent className="flex flex-wrap items-center justify-between gap-4 p-6 text-start">
            <div className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground">
                رمز الأستاذ للطلاب
              </p>
              <p
                className="font-mono text-lg font-bold text-brand-700"
                dir="ltr"
              >
                {profile.teacher_code}
              </p>
            </div>
            <p className="max-w-xs text-xs leading-relaxed text-muted-foreground">
              شارك هالرمز مع طلابك عند التسجيل
            </p>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3" data-spekit={SPEKIT.teacherStatsGrid}>
        <StatCard
          label="الطلاب"
          value={stats.studentCount}
          icon={Users}
          spekitId={SPEKIT.teacherStatStudents}
        />
        <StatCard
          label="الاختبارات"
          value={stats.quizCount}
          icon={BookOpen}
          spekitId={SPEKIT.teacherStatQuizzes}
        />
        <StatCard
          label="طلبات Pro"
          value={stats.pendingUpgrades}
          icon={Crown}
          valueClassName="text-amber-600"
          spekitId={SPEKIT.teacherStatProRequests}
        />
      </div>

      <div className="flex flex-wrap gap-3" data-spekit={SPEKIT.teacherQuickActions}>
        <Link
          href="/teacher/students"
          className={cn(
            buttonVariants({ size: "lg" }),
            "bg-brand-600 hover:bg-brand-700"
          )}
        >
          إدارة الطلاب
        </Link>
        <Link
          href="/teacher/quizzes"
          className={cn(buttonVariants({ variant: "outline", size: "lg" }))}
        >
          إدارة الاختبارات
        </Link>
      </div>
    </div>
  );
}
