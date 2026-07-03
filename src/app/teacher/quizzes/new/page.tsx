import { redirect } from "next/navigation";
import {
  createQuiz,
  getTeacherCategories,
  getTeacherGroups,
} from "@/actions/teacher";
import { QuizCreateForm } from "@/components/teacher/QuizCreateForm";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export const metadata = { title: "اختبار جديد | المؤيد" };

export default async function NewQuizPage() {
  const [categories, groups] = await Promise.all([
    getTeacherCategories(),
    getTeacherGroups(),
  ]);

  async function handleCreate(formData: FormData) {
    "use server";
    const id = await createQuiz(formData);
    redirect(`/teacher/quizzes/${id}`);
  }

  return (
    <div className="mx-auto w-full max-w-lg space-y-6">
      <h1 className="text-start text-xl font-bold tracking-tight">
        إنشاء اختبار جديد
      </h1>
      <Card className="overflow-hidden border-border/70 shadow-sm">
        <CardHeader className="space-y-1 p-6 pb-4 text-start">
          <CardTitle className="text-base font-semibold">
            بيانات الاختبار
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6 pt-0">
          <QuizCreateForm
            categories={categories}
            groups={groups}
            action={handleCreate}
          />
        </CardContent>
      </Card>
    </div>
  );
}
