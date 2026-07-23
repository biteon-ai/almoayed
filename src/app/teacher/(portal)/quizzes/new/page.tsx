import { getTeacherCategories, getTeacherGroups } from "@/actions/teacher";
import { QuizCreateWizard } from "@/components/teacher/QuizCreateWizard";

export const metadata = { title: "اختبار جديد | المؤيد" };

export default async function NewQuizPage() {
  const [categories, groups] = await Promise.all([
    getTeacherCategories(),
    getTeacherGroups(),
  ]);

  return (
    <div className="mx-auto w-full max-w-lg space-y-6">
      <h1 className="text-start text-xl font-bold tracking-tight">
        إنشاء اختبار جديد
      </h1>
      <QuizCreateWizard categories={categories} groups={groups} />
    </div>
  );
}
