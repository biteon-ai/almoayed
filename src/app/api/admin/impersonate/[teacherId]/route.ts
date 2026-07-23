import { NextResponse } from "next/server";
import { startTeacherImpersonation } from "@/lib/admin/impersonation";
import { apiGuard, requireSuperAdminApi } from "@/lib/admin/require-super-admin";

type RouteContext = { params: Promise<{ teacherId: string }> };

export async function POST(_request: Request, context: RouteContext) {
  const session = await requireSuperAdminApi();
  const { teacherId } = await context.params;

  return apiGuard(session, async (s) => {
    const result = await startTeacherImpersonation(s, teacherId);
    if (!result.ok) {
      const status = result.error.includes("بالفعل") ? 409 : 403;
      return NextResponse.json({ error: result.error }, { status });
    }

    return NextResponse.json({
      redirectTo: "/teacher/dashboard",
      teacherName: result.teacherName,
    });
  });
}
