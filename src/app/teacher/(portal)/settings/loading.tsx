import { TeacherRouteLoading } from "@/components/ui/teacher-route-loading";

export default function TeacherSettingsLoading() {
  return (
    <TeacherRouteLoading
      message="جاري فتح الإعدادات…"
      subMessage="نحضّر ملفك الشخصي"
    />
  );
}
