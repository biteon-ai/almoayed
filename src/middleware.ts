import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getIronSession } from "iron-session";
import { sessionOptions, type SessionData } from "@/lib/session";

const studentPaths = ["/dashboard", "/quiz"];
const teacherPaths = ["/teacher"];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isStudentRoute = studentPaths.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`)
  );
  const isTeacherRoute = teacherPaths.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`)
  );

  if (!isStudentRoute && !isTeacherRoute) {
    return NextResponse.next();
  }

  const response = NextResponse.next();
  const session = await getIronSession<SessionData>(
    request,
    response,
    sessionOptions
  );

  if (!session.isLoggedIn) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("from", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (isTeacherRoute && session.role !== "TEACHER") {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  if (isStudentRoute && session.role === "TEACHER") {
    return NextResponse.redirect(new URL("/teacher/dashboard", request.url));
  }

  return response;
}

export const config = {
  matcher: ["/dashboard/:path*", "/quiz/:path*", "/teacher/:path*"],
};
