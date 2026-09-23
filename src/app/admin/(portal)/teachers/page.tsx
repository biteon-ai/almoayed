import { getAdminKpis } from "@/lib/admin/kpis";
import { AdminTeachersTable } from "@/components/admin/AdminTeachersTable";

export const metadata = {
  title: { absolute: "إدارة المدرسين | Super Admin" },
};

export default async function AdminTeachersPage() {
  const kpis = await getAdminKpis();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold">إدارة المدرسين</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          إنشاء وتعديل وتعطيل حسابات المدرسين — لا يوجد تسجيل ذاتي للمدرسين
        </p>
      </div>
      <AdminTeachersTable
        stats={{
          totalTeachers: kpis.totalTeachers,
          activeTeachers: kpis.activeTeachers,
          totalExams: kpis.totalExams,
        }}
      />
    </div>
  );
}
