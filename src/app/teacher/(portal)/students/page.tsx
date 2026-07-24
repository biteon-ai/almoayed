import {
  getTeacherGroups,
  getTeacherStudents,
} from "@/actions/teacher";
import { StudentManagement } from "@/components/teacher/StudentManagement";
import { SPEKIT } from "@/lib/spekit-targets";
import type { StudentTeacherStatus, StudentTier } from "@/types/database";
import { Suspense } from "react";

export const metadata = { title: "إدارة الطلاب | المؤيد" };

interface PageProps {
  searchParams: Promise<{
    page?: string;
    tier?: string;
    status?: string;
  }>;
}

export default async function TeacherStudentsPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const page = Number(params.page) || 1;
  const tier = (params.tier as StudentTier | "all" | undefined) ?? "all";
  const status =
    (params.status as StudentTeacherStatus | "all" | undefined) ?? "all";

  const [studentsPage, groups] = await Promise.all([
    getTeacherStudents(
      {
        tier: tier === "free" || tier === "pro" ? tier : "all",
        status:
          status === "pending" ||
          status === "active" ||
          status === "deactivated"
            ? status
            : "all",
      },
      { page }
    ),
    getTeacherGroups(),
  ]);

  return (
    <div className="space-y-4" data-spekit={SPEKIT.teacherStudentsPage}>
      <h1 className="text-xl font-bold">إدارة الطلاب</h1>
      <Suspense
        fallback={
          <p className="text-sm text-muted-foreground">جاري التحميل...</p>
        }
      >
        <StudentManagement
          studentsPage={studentsPage}
          groups={groups}
          initialTier={tier === "free" || tier === "pro" ? tier : "all"}
          initialStatus={
            status === "pending" ||
            status === "active" ||
            status === "deactivated"
              ? status
              : "all"
          }
        />
      </Suspense>
    </div>
  );
}
