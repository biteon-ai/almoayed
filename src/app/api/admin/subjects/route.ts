import { NextResponse } from "next/server";
import { listSubjectCatalog } from "@/lib/admin/teachers";
import { apiGuard, requireSuperAdminApi } from "@/lib/admin/require-super-admin";

export async function GET() {
  const session = await requireSuperAdminApi();
  return apiGuard(session, async () => {
    const subjects = await listSubjectCatalog();
    return NextResponse.json({ subjects });
  });
}
