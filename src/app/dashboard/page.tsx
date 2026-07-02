import Link from "next/link";
import { redirect } from "next/navigation";
import {
  getAvailableQuizzes,
  getStudentProfile,
  getWeakPoints,
} from "@/actions/quiz";
import { logout } from "@/actions/auth";
import { requireStudent } from "@/lib/auth";
import { APP_SLOGAN } from "@/lib/constants";
import { Logo } from "@/components/brand/Logo";
import { WeakPointsCard } from "@/components/dashboard/WeakPointsCard";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { BookOpen, LogOut, ChevronLeft } from "lucide-react";

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

  const [quizzes, weakPoints] = await Promise.all([
    getAvailableQuizzes(),
    getWeakPoints(),
  ]);

  return (
    <div className="mx-auto min-h-dvh max-w-lg px-4 py-6">
      <header className="mb-8 flex items-center justify-between">
        <div>
          <Logo size="sm" />
          <p className="mt-1 text-xs text-muted-foreground">{APP_SLOGAN}</p>
        </div>
        <form action={logout}>
          <Button type="submit" variant="ghost" size="icon" aria-label="خروج">
            <LogOut className="size-5" />
          </Button>
        </form>
      </header>

      <section className="mb-8">
        <h1 className="text-xl font-bold">
          أهلاً {session.fullName || "بالطالب"} 👋
        </h1>
        <p className="text-sm text-muted-foreground">
          اختار اختبار وبلّش حلّ بإيدك
        </p>
      </section>

      <section className="mb-8 space-y-3">
        <h2 className="flex items-center gap-2 text-lg font-semibold">
          <BookOpen className="size-5 text-brand-600" />
          الاختبارات المتاحة
        </h2>

        {quizzes.length === 0 ? (
          <Card>
            <CardContent className="p-6 text-center text-sm text-muted-foreground">
              ما في اختبارات حالياً — راجع الأستاذ قريباً.
            </CardContent>
          </Card>
        ) : (
          quizzes.map((quiz) => (
            <Link key={quiz.id} href={`/quiz/${quiz.id}`}>
              <Card className="transition-colors hover:border-brand-300 hover:bg-brand-50/50 dark:hover:bg-brand-950/20">
                <CardHeader className="flex-row items-center justify-between space-y-0 p-4">
                  <div>
                    <CardTitle className="text-base">{quiz.title}</CardTitle>
                    <CardDescription className="text-xs">
                      اضغط للبدء — الحلول مقفولة
                    </CardDescription>
                  </div>
                  <ChevronLeft className="size-5 text-muted-foreground" />
                </CardHeader>
              </Card>
            </Link>
          ))
        )}
      </section>

      <section>
        <WeakPointsCard categories={weakPoints} />
      </section>
    </div>
  );
}
