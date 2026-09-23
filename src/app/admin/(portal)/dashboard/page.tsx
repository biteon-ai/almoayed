import { getAdminKpis } from "@/lib/admin/kpis";
import { AdminKpiCards } from "@/components/admin/AdminKpiCards";

export const metadata = {
  title: "لوحة Super Admin",
};

export default async function AdminDashboardPage() {
  const kpis = await getAdminKpis();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold">لوحة التحكم</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          نظرة عامة على صحة المنصة واستخدامها
        </p>
      </div>
      <AdminKpiCards kpis={kpis} />
    </div>
  );
}
