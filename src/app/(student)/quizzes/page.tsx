import { redirect } from "next/navigation";
import { getStudentProfile, getStudentQuizzesPageData } from "@/actions/quiz";
import { requireStudent } from "@/lib/auth";
import { APP_DESCRIPTION } from "@/lib/constants";
import { StudentQuizzesView } from "@/components/student/StudentQuizzesView";

export const metadata = {
  title: "الاختبارات | المؤيد",
  description: APP_DESCRIPTION,
};

export default async function StudentQuizzesPage() {
  await requireStudent();

  const profile = await getStudentProfile();
  if (!profile?.is_subscribed) {
    redirect("/login");
  }

  const data = await getStudentQuizzesPageData();

  return <StudentQuizzesView stats={data.stats} quizzes={data.quizzes} />;
}
