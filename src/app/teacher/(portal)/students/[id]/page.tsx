import { getTeacherStudentDetail } from "@/actions/teacher";
import { StudentDetailDashboard } from "@/components/teacher/StudentDetailDashboard";
import { SPEKIT } from "@/lib/spekit-targets";
import { notFound } from "next/navigation";

export const metadata = { title: "تفاصيل الطالب" };

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function TeacherStudentDetailPage({ params }: PageProps) {
  const { id } = await params;
  const detail = await getTeacherStudentDetail(id);

  if (!detail) notFound();

  return (
    <div
      className="mx-auto w-full max-w-7xl"
      data-spekit={SPEKIT.teacherStudentDetailPage}
    >
      <StudentDetailDashboard detail={detail} />
    </div>
  );
}
