import { NextResponse } from "next/server";
import { hardDeleteStudent } from "@/lib/admin/students";
import { apiGuard, requireSuperAdminApi } from "@/lib/admin/require-super-admin";

type RouteContext = { params: Promise<{ id: string }> };

export async function DELETE(request: Request, context: RouteContext) {
  const session = await requireSuperAdminApi();
  const { id } = await context.params;

  return apiGuard(session, async (s) => {
    let body: { confirm?: boolean } = {};
    try {
      body = (await request.json()) as { confirm?: boolean };
    } catch {
      body = {};
    }

    const result = await hardDeleteStudent(s.profileId, id, {
      confirm: body.confirm === true,
    });

    if (!result.ok) {
      const status = result.error.includes("غير موجود")
        ? 404
        : result.error.includes("الطلاب فقط")
          ? 400
          : 400;
      return NextResponse.json({ error: result.error }, { status });
    }

    return NextResponse.json({ ok: true, deletedStudentId: id });
  });
}
