import { AdminStudentsTable } from "@/components/admin/AdminStudentsTable";

export const metadata = {
  title: "إدارة الطلاب | Super Admin",
};

export default function AdminStudentsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold">إدارة الطلاب</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          عرض كل حسابات الطلاب على المنصة — بما في ذلك غير المرتبطين بمدرس —
          مع إمكانية الحذف النهائي بعد تأكيد مزدوج
        </p>
      </div>
      <AdminStudentsTable />
    </div>
  );
}
