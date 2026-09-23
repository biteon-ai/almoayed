import { PageLoadingView } from "@/components/ui/page-loading-view";

export default function ResultDetailLoading() {
  return (
    <PageLoadingView
      message="جاري تحميل تفاصيل النتيجة..."
      subMessage="نحضّر مراجعة إجاباتك"
    />
  );
}
