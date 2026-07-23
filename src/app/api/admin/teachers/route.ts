import { NextResponse } from "next/server";
import {
  createTeacher,
  listTeachers,
} from "@/lib/admin/teachers";
import { apiGuard, requireSuperAdminApi } from "@/lib/admin/require-super-admin";

export async function GET(request: Request) {
  const session = await requireSuperAdminApi();
  return apiGuard(session, async () => {
    const { searchParams } = new URL(request.url);
    const q = searchParams.get("q") ?? undefined;
    const status = (searchParams.get("status") as "active" | "inactive" | "all") ?? "all";
    const teachers = await listTeachers({ q, status });
    return NextResponse.json({ teachers });
  });
}

export async function POST(request: Request) {
  const session = await requireSuperAdminApi();
  return apiGuard(session, async (s) => {
    const body = await request.json();
    const result = await createTeacher(s.profileId, {
      fullName: body.fullName ?? "",
      email: body.email ?? "",
      password: body.password,
      generatePassword: body.generatePassword ?? false,
      phoneNumber: body.phoneNumber ?? null,
      subjectIds: body.subjectIds ?? [],
      status: body.status ?? "active",
      maxQuizLimit: body.maxQuizLimit ?? null,
    });

    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json(
      {
        teacher: result.teacher,
        generatedPassword: result.generatedPassword,
      },
      { status: 201 }
    );
  });
}
