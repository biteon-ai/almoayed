import { NextRequest, NextResponse } from "next/server";
import { consumeTeacherMagicLink } from "@/actions/teacher-login-recovery";
import { AuthErrorCode } from "@/lib/auth-error-codes";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * [AUTH-009] Consume magic link in a Route Handler so iron-session can
 * write cookies (not allowed during RSC page render).
 */
export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get("token")?.trim() ?? "";
  const fail = new URL("/teacher/magic", request.url);

  if (!token) {
    fail.searchParams.set("code", AuthErrorCode.MAGIC_INVALID);
    return NextResponse.redirect(fail);
  }

  const result = await consumeTeacherMagicLink(token);
  if (result.status === "success") {
    return NextResponse.redirect(new URL("/teacher/dashboard", request.url));
  }

  fail.searchParams.set("code", result.code);
  return NextResponse.redirect(fail);
}
