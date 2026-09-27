import { PageLoadingView } from "@/components/ui/page-loading-view";

export default function ResultsHistoryLoading() {
  return (
    <PageLoadingView
      message="جاري تحميل سجل المحاولات..."
      subMessage="نرتّب كل محاولاتك السابقة"
    />
  );
}
