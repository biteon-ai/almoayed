import { getTeacherProfile, getTeacherDashboardAnalytics } from "@/actions/teacher";
import { requireTeacher } from "@/lib/auth";
import { TeacherDashboardAnalytics } from "@/components/teacher/TeacherDashboardAnalytics";
import { Card, CardContent } from "@/components/ui/card";
import { SPEKIT } from "@/lib/spekit-targets";

export const metadata = { title: "لوحة الأستاذ | المؤيد" };

export default async function TeacherDashboardPage() {
  const session = await requireTeacher();
  const [profile, analytics] = await Promise.all([
    getTeacherProfile(),
    getTeacherDashboardAnalytics(),
  ]);

  return (
    <div
      className="mx-auto w-full space-y-6"
      data-spekit={SPEKIT.teacherDashboard}
    >
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

      <TeacherDashboardAnalytics
        teacherName={session.fullName}
        schoolName={profile?.school_name}
        analytics={analytics}
      />
    </div>
  );
}
