import { PageLoadingView } from "@/components/ui/page-loading-view";

export default function DashboardLoading() {
  return (
    <PageLoadingView
      message="جاري فتح لوحة الطالب…"
      subMessage="نحضّر اختباراتك ونتائجك"
    />
  );
}
