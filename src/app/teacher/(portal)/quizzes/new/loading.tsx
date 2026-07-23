import { TeacherRouteLoading } from "@/components/ui/teacher-route-loading";

export default function TeacherQuizNewLoading() {
  return (
    <TeacherRouteLoading
      message="جاري فتح نموذج الاختبار…"
      subMessage="أنشئ اختباراً جديداً"
    />
  );
}
