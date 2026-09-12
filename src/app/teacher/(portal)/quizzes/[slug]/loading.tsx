import { TeacherRouteLoading } from "@/components/ui/teacher-route-loading";

export default function TeacherQuizEditLoading() {
  return (
    <TeacherRouteLoading
      message="جاري فتح محرر الاختبار…"
      subMessage="نحضّر الأسئلة والإعدادات"
    />
  );
}
