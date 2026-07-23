import { redirect } from "next/navigation";
import { getStudentProfile, getStudentResultsPageData } from "@/actions/quiz";
import { requireStudent } from "@/lib/auth";
import { APP_DESCRIPTION } from "@/lib/constants";
import { StudentResultsView } from "@/components/student/StudentResultsView";

export const metadata = {
  title: "نتائجي | المؤيد",
  description: APP_DESCRIPTION,
};

export default async function StudentResultsPage() {
  await requireStudent();

  const profile = await getStudentProfile();
  if (!profile?.is_subscribed) {
    redirect("/login");
  }

  const data = await getStudentResultsPageData();

  return (
    <StudentResultsView
      stats={data.stats}
      scores={data.scores}
      totalQuizzes={data.totalQuizzes}
    />
  );
}
