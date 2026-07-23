import { NextResponse } from "next/server";
import { exitTeacherImpersonation } from "@/lib/admin/impersonation";

export async function POST() {
  const result = await exitTeacherImpersonation();
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  return NextResponse.json({ redirectTo: "/admin/teachers" });
}
