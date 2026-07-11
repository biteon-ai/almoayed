import { PageLoadingView } from "@/components/ui/page-loading-view";

export default function TeacherLoading() {
  return (
    <PageLoadingView
      message="جاري التحميل…"
      subMessage="لوحة الأستاذ"
    />
  );
}
