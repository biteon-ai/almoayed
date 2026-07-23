import { NextResponse } from "next/server";
import {
  ensureSuperAdminProfile,
  establishSuperAdminSession,
} from "@/lib/admin/auth";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      email?: string;
      password?: string;
    };

    const email = body.email?.trim() ?? "";
    const password = body.password ?? "";

    if (!email || !password) {
      return NextResponse.json(
        { error: "البريد الإلكتروني وكلمة المرور مطلوبان." },
        { status: 400 }
      );
    }

    const profile = await ensureSuperAdminProfile(email, password);
    if (!profile) {
      return NextResponse.json(
        { error: "بيانات الدخول غير صحيحة." },
        { status: 401 }
      );
    }

    const ok = await establishSuperAdminSession(profile);
    if (!ok) {
      return NextResponse.json(
        { error: "تعذر إنشاء الجلسة." },
        { status: 500 }
      );
    }

    return NextResponse.json({ ok: true, redirectTo: "/admin/dashboard" });
  } catch {
    return NextResponse.json(
      { error: "حدث خطأ غير متوقع." },
      { status: 500 }
    );
  }
}
