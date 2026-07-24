import { notFound } from "next/navigation";
import { getStudentById } from "@/lib/admin/students";
import { AdminStudentDetailView } from "@/components/admin/AdminStudentDetailView";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const student = await getStudentById(id);
  return {
    title: student
      ? `${student.fullName} | إدارة الطلاب`
      : "ملف الطالب | Super Admin",
  };
}

export default async function AdminStudentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const student = await getStudentById(id);
  if (!student) notFound();

  return <AdminStudentDetailView student={student} />;
}
