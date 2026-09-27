import { Suspense } from "react";
import { redirect } from "next/navigation";
import { getStudentProfile, getStudentResultsPageData } from "@/actions/quiz";
import { requireStudent } from "@/lib/auth";
import { APP_DESCRIPTION } from "@/lib/constants";
import { StudentResultsHistoryView } from "@/components/student/StudentResultsHistoryView";
import { PageLoadingView } from "@/components/ui/page-loading-view";

/** Auth + live scores — request-scoped. */
export const dynamic = "force-dynamic";

export const metadata = {
  title: "كل المحاولات",
  description: APP_DESCRIPTION,
};

export default async function StudentResultsHistoryPage() {
  await requireStudent();

  const profile = await getStudentProfile();
  if (!profile?.is_subscribed) {
    redirect("/login");
  }

  const data = await getStudentResultsPageData();

  return (
    <Suspense
      fallback={
        <PageLoadingView
          message="جاري تحميل سجل المحاولات..."
          subMessage="نرتّب كل محاولاتك السابقة"
        />
      }
    >
      <StudentResultsHistoryView scores={data.scores} />
    </Suspense>
  );
}
