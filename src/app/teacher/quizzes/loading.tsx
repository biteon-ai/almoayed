import { TeacherRouteLoading } from "@/components/ui/teacher-route-loading";

export default function TeacherQuizzesLoading() {
  return (
    <TeacherRouteLoading
      message="جاري فتح إدارة الاختبارات…"
      subMessage="نحضّر قائمة اختباراتك"
    />
  );
}
