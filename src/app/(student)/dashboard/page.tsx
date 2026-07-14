import { redirect } from "next/navigation";
import { getStudentDashboardData, getStudentProfile } from "@/actions/quiz";
import { requireStudent } from "@/lib/auth";
import { APP_SLOGAN } from "@/lib/constants";
import { DashboardStatsRow } from "@/components/dashboard/DashboardStatsRow";
import { QuizCarousel } from "@/components/dashboard/QuizCarousel";
import { DashboardTabs } from "@/components/dashboard/DashboardTabs";
import { SPEKIT } from "@/lib/spekit-targets";

export const metadata = {
  title: "لوحة الطالب | المؤيد",
  description: APP_SLOGAN,
};

export default async function DashboardPage() {
  const session = await requireStudent();

  const profile = await getStudentProfile();
  if (!profile?.is_subscribed) {
    redirect("/login");
  }

  const dashboard = await getStudentDashboardData();

  return (
    <div
      className="mx-auto max-w-6xl px-4 py-6 md:py-8"
      data-spekit={SPEKIT.studentDashboard}
    >
      <div className="mb-6 md:hidden">
        <DashboardStatsRow stats={dashboard.stats} variant="horizontal" />
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-12 md:gap-8">
        <div className="space-y-6 md:col-span-8 md:space-y-8 lg:col-span-9">
          <section
            className="rounded-2xl border border-slate-100 bg-gradient-to-l from-brand-50/40 to-white p-5 shadow-sm md:p-6"
            data-spekit={SPEKIT.studentWelcome}
          >
            <h1 className="text-xl font-bold text-slate-800 md:text-2xl">
              أهلاً {session.fullName || "بالطالب"} 👋
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              اختار اختبار وبلّش حلّ بإيدك — كل شي جاهز إلك.
            </p>
          </section>

          <QuizCarousel quizzes={dashboard.quizzes} />

          <DashboardTabs
            recentScores={dashboard.recentScores}
            weakPoints={dashboard.weakPoints}
            teachers={dashboard.teachers}
            currentTeacherId={session.currentTeacherId}
          />
        </div>

        <aside className="hidden md:col-span-4 md:block lg:col-span-3">
          <div className="sticky top-24 space-y-4">
            <h2 className="text-sm font-bold text-slate-700">ملخص أدائك</h2>
            <DashboardStatsRow stats={dashboard.stats} variant="vertical" />
          </div>
        </aside>
      </div>
    </div>
  );
}
