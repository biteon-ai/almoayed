import { getTeacherProfile, getTeacherDashboardAnalytics } from "@/actions/teacher";
import { TrialInviteCard } from "@/components/teacher/TrialInviteCard";
import { TeacherDashboardAnalytics } from "@/components/teacher/TeacherDashboardAnalytics";
import { requireTeacher } from "@/lib/auth";
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
      {profile?.teacher_code ? (
        <TrialInviteCard
          teacherCode={profile.teacher_code}
          teacherName={session.fullName}
          spekitRoot
        />
      ) : null}

      <TeacherDashboardAnalytics
        teacherName={session.fullName}
        schoolName={profile?.school_name}
        analytics={analytics}
      />
    </div>
  );
}
