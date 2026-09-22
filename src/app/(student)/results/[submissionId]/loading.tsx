import { PageLoadingView } from "@/components/ui/page-loading-view";

export default function ResultDetailLoading() {
  return (
    <PageLoadingView
      compact
      message="جاري تحميل تفاصيل النتيجة..."
      subMessage="نحضّر مراجعة إجاباتك"
    />
  );
}
