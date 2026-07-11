import { PageLoadingView } from "@/components/ui/page-loading-view";

export default function TeacherDashboardLoading() {
  return (
    <PageLoadingView
      message="جاري فتح لوحة الأستاذ…"
      subMessage="نحضّر إحصائياتك وطلابك"
    />
  );
}
