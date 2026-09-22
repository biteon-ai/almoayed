"use client";

import { useSearchParams } from "next/navigation";
import { PageLoadingView } from "@/components/ui/page-loading-view";

/** Client body for `/quiz/[id]/loading` — picks review vs taking copy from `?review=`. */
export function QuizRouteLoadingBody() {
  const searchParams = useSearchParams();
  const isReview = Boolean(searchParams.get("review")?.trim());

  return (
    <PageLoadingView
      compact
      message={
        isReview
          ? "جاري تحميل تفاصيل النتيجة..."
          : "جاري تحميل الاختبار..."
      }
      subMessage={isReview ? "نحضّر مراجعة إجاباتك" : "نحضّر الأسئلة"}
    />
  );
}
