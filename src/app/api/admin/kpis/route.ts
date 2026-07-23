import { NextResponse } from "next/server";
import { getAdminKpis } from "@/lib/admin/kpis";
import { apiGuard, requireSuperAdminApi } from "@/lib/admin/require-super-admin";

export async function GET() {
  const session = await requireSuperAdminApi();
  return apiGuard(session, async () => {
    const kpis = await getAdminKpis();
    return NextResponse.json(kpis);
  });
}
