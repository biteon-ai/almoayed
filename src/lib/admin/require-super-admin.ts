import { NextResponse } from "next/server";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import type { SessionData } from "@/lib/session";

export function isSuperAdminSession(session: SessionData): boolean {
  return (
    session.isLoggedIn &&
    session.role === "SUPER_ADMIN" &&
    !session.impersonation
  );
}

export async function requireSuperAdmin(): Promise<SessionData> {
  const session = await getSession();
  if (!isSuperAdminSession(session)) {
    redirect("/admin/login");
  }
  return session;
}

export async function requireSuperAdminApi(): Promise<
  SessionData | NextResponse
> {
  const session = await getSession();
  if (!session.isLoggedIn) {
    return NextResponse.json({ error: "يجب تسجيل الدخول." }, { status: 401 });
  }
  if (session.impersonation) {
    return NextResponse.json(
      { error: "لا يمكن تنفيذ هذا الإجراء أثناء انتحال شخصية مدرس." },
      { status: 403 }
    );
  }
  if (session.role !== "SUPER_ADMIN") {
    return NextResponse.json({ error: "غير مصرح." }, { status: 403 });
  }
  return session;
}

export function apiGuard<T>(
  session: SessionData | NextResponse,
  handler: (session: SessionData) => Promise<T>
): Promise<T | NextResponse> {
  if (session instanceof NextResponse) return Promise.resolve(session);
  return handler(session);
}
