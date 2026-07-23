import { getTeacherQuizzes } from "@/actions/teacher";
import { QuizManagement } from "@/components/teacher/QuizManagement";
import { SPEKIT } from "@/lib/spekit-targets";

export const metadata = { title: "الاختبارات | المؤيد" };

export default async function TeacherQuizzesPage() {
  const quizzes = await getTeacherQuizzes();

  return (
    <div data-spekit={SPEKIT.teacherQuizzesPage}>
      <QuizManagement quizzes={quizzes} />
    </div>
  );
}
