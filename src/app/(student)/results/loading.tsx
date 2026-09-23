import { PageLoadingView } from "@/components/ui/page-loading-view";

export default function ResultsLoading() {
  return (
    <PageLoadingView
      message="جاري فتح النتائج…"
      subMessage="نحضّر علاماتك والمحاولات السابقة"
    />
  );
}
