import { listSubjectCatalog } from "@/lib/admin/teachers";
import { TeacherFormView } from "@/components/admin/TeacherFormView";

export const metadata = {
  title: { absolute: "إضافة مدرس جديد | Super Admin" },
};

export default async function AdminCreateTeacherPage() {
  const subjects = await listSubjectCatalog();

  return <TeacherFormView mode="create" subjects={subjects} />;
}
