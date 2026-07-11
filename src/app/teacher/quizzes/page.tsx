import Link from "next/link";
import { getTeacherQuizzes } from "@/actions/teacher";
import { QuizListItem } from "@/components/teacher/QuizListItem";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { SPEKIT } from "@/lib/spekit-targets";

export const metadata = { title: "الاختبارات | المؤيد" };

export default async function TeacherQuizzesPage() {
  const quizzes = await getTeacherQuizzes();

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6" data-spekit={SPEKIT.teacherQuizzesPage}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-xl font-bold tracking-tight text-start">
          إدارة الاختبارات
        </h1>
        <Link
          href="/teacher/quizzes/new"
          className={cn(
            buttonVariants({ variant: "brand", size: "lg" }),
            "w-full gap-1.5 sm:w-auto"
          )}
          data-spekit={SPEKIT.teacherQuizNewButton}
        >
          <Plus className="size-4" />
          اختبار جديد
        </Link>
      </div>

      <div className="space-y-3">
        {quizzes.map((quiz) => (
          <QuizListItem key={quiz.id} quiz={quiz} />
        ))}
        {quizzes.length === 0 && (
          <Card>
            <CardContent className="p-8 text-center text-sm text-muted-foreground">
              ما في اختبارات بعد. أنشئ أول اختبار!
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
