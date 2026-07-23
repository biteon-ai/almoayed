import { TeacherRouteLoading } from "@/components/ui/teacher-route-loading";

export default function TeacherDashboardLoading() {
  return (
    <TeacherRouteLoading
      message="جاري فتح لوحة الأستاذ…"
      subMessage="نحضّر إحصائياتك وطلابك"
    />
  );
}
