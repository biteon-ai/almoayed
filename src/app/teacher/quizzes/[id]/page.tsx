import Link from "next/link";
import {
  addQuestion,
  getQuizQuestions,
  getTeacherQuizzes,
} from "@/actions/teacher";
import { EditQuizBulkImportSection } from "@/components/teacher/EditQuizBulkImportSection";
import { QuestionAddForm } from "@/components/teacher/QuestionAddForm";
import { TeacherQuestionsList } from "@/components/teacher/TeacherQuestionsList";
import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { SPEKIT } from "@/lib/spekit-targets";
import { notFound } from "next/navigation";
import { EditQuizImportToast } from "@/components/teacher/EditQuizImportToast";
import { Suspense } from "react";

export const metadata = { title: "تحرير الاختبار | المؤيد" };

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function EditQuizPage({ params }: PageProps) {
  const { id } = await params;
  const quizzes = await getTeacherQuizzes();
  const quiz = quizzes.find((q) => q.id === id);
  if (!quiz) notFound();

  const questions = await getQuizQuestions(id);

  async function handleAddQuestion(formData: FormData) {
    "use server";
    await addQuestion(id, formData);
  }

  return (
    <div
      className="mx-auto w-full max-w-3xl space-y-8"
      data-spekit={SPEKIT.teacherQuizEditPage}
    >
      <Suspense fallback={null}>
        <EditQuizImportToast />
      </Suspense>
      <div className="flex items-center gap-3 text-start">
        <Link
          href="/teacher/quizzes"
          className={cn(buttonVariants({ variant: "ghost", size: "sm" }))}
        >
          <ArrowRight className="size-4" />
          رجوع
        </Link>
        <h1 className="text-xl font-bold tracking-tight">{quiz.title}</h1>
      </div>

      <Suspense
        fallback={
          <Card className="overflow-hidden border-border/70 shadow-sm">
            <CardContent className="p-6 text-sm text-muted-foreground">
              جاري تحميل الاستيراد...
            </CardContent>
          </Card>
        }
      >
        <EditQuizBulkImportSection quizId={id} quizTitle={quiz.title} />
      </Suspense>

      <Card className="overflow-hidden border-border/70 shadow-sm">
        <CardHeader className="space-y-1 p-6 pb-4 text-start">
          <CardTitle className="text-base font-semibold">
            إضافة سؤال يدوياً
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6 pt-0">
          <QuestionAddForm action={handleAddQuestion} />
        </CardContent>
      </Card>

      <TeacherQuestionsList quizId={id} questions={questions} />
    </div>
  );
}
