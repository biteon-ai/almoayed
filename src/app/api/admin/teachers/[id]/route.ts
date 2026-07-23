import { NextResponse } from "next/server";
import { deleteTeacher, updateTeacher } from "@/lib/admin/teachers";
import { apiGuard, requireSuperAdminApi } from "@/lib/admin/require-super-admin";

type RouteContext = { params: Promise<{ id: string }> };

export async function PUT(request: Request, context: RouteContext) {
  const session = await requireSuperAdminApi();
  const { id } = await context.params;

  return apiGuard(session, async (s) => {
    const body = await request.json();
    const result = await updateTeacher(s.profileId, id, {
      fullName: body.fullName,
      email: body.email,
      phoneNumber: body.phoneNumber,
      subjectIds: body.subjectIds,
      status: body.status,
      maxQuizLimit: body.maxQuizLimit,
      newPassword: body.newPassword,
      generatePassword: body.generatePassword,
    });

    if (!result.ok) {
      const status = result.error.includes("غير موجود") ? 404 : 400;
      return NextResponse.json({ error: result.error }, { status });
    }

    return NextResponse.json({
      teacher: result.teacher,
      generatedPassword: result.generatedPassword,
    });
  });
}

export async function DELETE(request: Request, context: RouteContext) {
  const session = await requireSuperAdminApi();
  const { id } = await context.params;

  return apiGuard(session, async (s) => {
    const body = await request.json();
    const result = await deleteTeacher(s.profileId, id, {
      confirm: body.confirm === true,
      disposition: body.disposition,
      reassignToTeacherId: body.reassignToTeacherId,
    });

    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({ ok: true, deletedTeacherId: id });
  });
}
