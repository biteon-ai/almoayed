import {
  getTeacherGroups,
  getTeacherStudents,
} from "@/actions/teacher";
import { StudentManagement } from "@/components/teacher/StudentManagement";

export const metadata = { title: "إدارة الطلاب | المؤيد" };

export default async function TeacherStudentsPage() {
  const [students, groups] = await Promise.all([
    getTeacherStudents(),
    getTeacherGroups(),
  ]);

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold">إدارة الطلاب</h1>
      <StudentManagement students={students} groups={groups} />
    </div>
  );
}
