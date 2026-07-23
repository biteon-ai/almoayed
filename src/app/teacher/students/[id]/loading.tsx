import { TeacherRouteLoading } from "@/components/ui/teacher-route-loading";

export default function TeacherStudentDetailLoading() {
  return (
    <TeacherRouteLoading
      message="جاري فتح ملف الطالب…"
      subMessage="نحضّر التحليلات ونتائج الاختبارات"
    />
  );
}
