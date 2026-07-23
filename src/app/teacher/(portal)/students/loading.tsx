import { TeacherRouteLoading } from "@/components/ui/teacher-route-loading";

export default function TeacherStudentsLoading() {
  return (
    <TeacherRouteLoading
      message="جاري فتح إدارة الطلاب…"
      subMessage="نحضّر قائمة الطلاب والمجموعات"
    />
  );
}
