import { PageLoadingView } from "@/components/ui/page-loading-view";

export default function QuizzesLoading() {
  return (
    <PageLoadingView
      message="جاري فتح الاختبارات…"
      subMessage="نحضّر قائمة الاختبارات المتاحة"
    />
  );
}
