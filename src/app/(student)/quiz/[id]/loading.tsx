import { Suspense } from "react";
import { PageLoadingView } from "@/components/ui/page-loading-view";
import { QuizRouteLoadingBody } from "@/components/quiz/QuizRouteLoadingBody";

export default function QuizPageLoading() {
  return (
    <Suspense
      fallback={
        <PageLoadingView
          message="جاري التحميل..."
          subMessage="نحضّر صفحتك"
        />
      }
    >
      <QuizRouteLoadingBody />
    </Suspense>
  );
}
