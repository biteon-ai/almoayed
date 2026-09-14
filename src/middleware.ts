import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getIronSession } from "iron-session";
import { sessionOptions, type SessionData } from "@/lib/session";

const studentPaths = [
  "/dashboard",
  "/quiz",
  "/quizzes",
  "/results",
  "/onboarding",
  "/profile",
];
const teacherPaths = ["/teacher"];
const teacherAuthPublicPaths = [
  "/teacher/login",
  "/teacher/reset",
  "/teacher/magic",
];
const adminPublicPaths = ["/admin/login", "/admin/emergency"];

function matchesPrefix(pathname: string, prefixes: string[]) {
  return prefixes.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`)
  );
}

function isNextServerAction(request: NextRequest): boolean {
  // Next.js Server Actions POST to the current page. A middleware redirect
  // (307) cannot be forwarded as an action result — the client gets undefined.
  return (
    request.method === "POST" &&
    (request.headers.has("next-action") || request.headers.has("Next-Action"))
  );
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (isNextServerAction(request)) {
    return NextResponse.next();
  }

  const isSettingsRoute =
    pathname === "/settings" || pathname.startsWith("/settings/");

  const isAdminRoute =
    pathname === "/admin" || pathname.startsWith("/admin/");
  const isAdminPublic = adminPublicPaths.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`)
  );
  const isAdminProtected = isAdminRoute && !isAdminPublic;

  const isTeacherAuthPublic = teacherAuthPublicPaths.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`)
  );
  const isStudentRoute = matchesPrefix(pathname, studentPaths);
  const isTeacherRoute =
    matchesPrefix(pathname, teacherPaths) && !isTeacherAuthPublic;

  // PERF-001: Session cookie decrypt only — never add Supabase/DB here.
  // Device lock (AUTH-003) runs once per RSC request via cached require* in lib/auth.ts.
  if (isAdminProtected || isSettingsRoute || isStudentRoute || isTeacherRoute) {
    const response = NextResponse.next();
    const session = await getIronSession<SessionData>(
      request,
      response,
      sessionOptions
    );

    if (isAdminProtected) {
      if (
        !session.isLoggedIn ||
        session.role !== "SUPER_ADMIN" ||
        session.impersonation
      ) {
        const loginUrl = new URL("/admin/login", request.url);
        loginUrl.searchParams.set("from", pathname);
        return NextResponse.redirect(loginUrl);
      }
      return response;
    }

    if (isSettingsRoute) {
      if (!session.isLoggedIn) {
        const loginUrl = new URL("/login", request.url);
        loginUrl.searchParams.set("from", pathname);
        return NextResponse.redirect(loginUrl);
      }
      return response;
    }

    if (!session.isLoggedIn) {
      const loginUrl = new URL(
        isTeacherRoute ? "/teacher/login" : "/login",
        request.url
      );
      loginUrl.searchParams.set("from", pathname);
      return NextResponse.redirect(loginUrl);
    }

    if (isTeacherRoute && session.role !== "TEACHER") {
      if (session.role === "SUPER_ADMIN") {
        return NextResponse.redirect(new URL("/admin/dashboard", request.url));
      }
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }

    if (isStudentRoute && session.role === "TEACHER") {
      return NextResponse.redirect(new URL("/teacher/dashboard", request.url));
    }

    if (isStudentRoute && session.role === "SUPER_ADMIN") {
      return NextResponse.redirect(new URL("/admin/dashboard", request.url));
    }

    return response;
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/quiz/:path*",
    "/quizzes/:path*",
    "/results/:path*",
    "/onboarding/:path*",
    "/profile/:path*",
    "/teacher/:path*",
    "/admin/:path*",
    "/settings",
  ],
};
