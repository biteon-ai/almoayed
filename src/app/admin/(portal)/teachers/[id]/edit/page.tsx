import { notFound } from "next/navigation";
import { getTeacherById, listSubjectCatalog } from "@/lib/admin/teachers";
import { TeacherFormView } from "@/components/admin/TeacherFormView";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const teacher = await getTeacherById(id);
  return {
    title: teacher
      ? `تعديل ${teacher.fullName} | Super Admin`
      : "تعديل المدرس | Super Admin",
  };
}

export default async function AdminEditTeacherPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [subjects, teacher] = await Promise.all([
    listSubjectCatalog(),
    getTeacherById(id),
  ]);

  if (!teacher) notFound();

  return <TeacherFormView mode="edit" subjects={subjects} teacher={teacher} />;
}
