import Link from "next/link";
import {
  addQuestion,
  getQuizQuestions,
  getTeacherQuizzes,
  importQuestions,
} from "@/actions/teacher";
import { FileUploadZone } from "@/components/teacher/FileUploadZone";
import { QuestionAddForm } from "@/components/teacher/QuestionAddForm";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { ArrowRight, Upload } from "lucide-react";
import { cn } from "@/lib/utils";
import { notFound } from "next/navigation";

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

  async function handleImport(formData: FormData) {
    "use server";
    await importQuestions(id, formData);
  }

  return (
    <div className="mx-auto w-full max-w-3xl space-y-8">
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

      <Card className="overflow-hidden border-border/70 shadow-sm">
        <CardHeader className="space-y-1 p-6 pb-4 text-start">
          <CardTitle className="text-base font-semibold">
            استيراد أسئلة بالجملة
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6 pt-0">
          <form action={handleImport} className="space-y-4">
            <FileUploadZone />
            <Button type="submit" variant="outline" className="h-11 gap-2 px-5">
              <Upload className="size-4" />
              استيراد
            </Button>
          </form>
        </CardContent>
      </Card>

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

      <div className="space-y-3">
        <h2 className="text-start text-base font-semibold">
          الأسئلة ({questions.length})
        </h2>
        {questions.map((q, i) => (
          <Card key={q.id} className="border-border/70 shadow-sm">
            <CardContent className="p-5 text-start">
              <p className="text-sm font-medium leading-relaxed">
                {i + 1}. {q.question_text}
              </p>
              <p className="mt-2 text-xs text-muted-foreground">
                الإجابة: {q.correct_answer} — {q.category_tag}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
