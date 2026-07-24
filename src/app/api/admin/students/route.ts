import { NextResponse } from "next/server";
import { listStudents } from "@/lib/admin/students";
import { apiGuard, requireSuperAdminApi } from "@/lib/admin/require-super-admin";

export async function GET(request: Request) {
  const session = await requireSuperAdminApi();
  return apiGuard(session, async () => {
    const { searchParams } = new URL(request.url);
    const q = searchParams.get("q") ?? undefined;
    const page = Number(searchParams.get("page") ?? "1");
    const result = await listStudents({ q }, { page });
    return NextResponse.json(result);
  });
}
