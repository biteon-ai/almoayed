"use server";

import { getIronSession } from "iron-session";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { generateSessionToken } from "@/lib/import-questions";
import {
  defaultSession,
  sessionOptions,
  type SessionData,
} from "@/lib/session";
import {
  buildTeacherVerificationUrl,
  DEMO_STUDENT,
  DEMO_TEACHER,
  normalizeWhatsAppNumber,
} from "@/lib/constants";
import type { Profile } from "@/types/database";
import type { LoginState } from "@/types/auth";

export type { LoginState };

async function establishSession(
  profile: Profile,
  teacherId: string | null
): Promise<"TEACHER" | "STUDENT"> {
  const sessionToken = generateSessionToken();
  const supabase = createAdminClient();

  await supabase
    .from("profiles")
    .update({ last_session_id: sessionToken })
    .eq("id", profile.id);

  const cookieStore = await cookies();
  const session = await getIronSession<SessionData>(cookieStore, sessionOptions);

  session.profileId = profile.id;
  session.whatsappNumber = profile.whatsapp_number;
  session.fullName = profile.full_name;
  session.role = profile.role;
  session.isLoggedIn = true;
  session.sessionToken = sessionToken;
  session.currentTeacherId = teacherId;

  await session.save();
  return profile.role;
}

export async function loginWithWhatsApp(
  _prev: LoginState | null,
  formData: FormData
): Promise<LoginState> {
  const rawNumber = formData.get("whatsapp_number");
  const fullName = (formData.get("full_name") as string)?.trim() ?? "";
  const teacherCode = (formData.get("teacher_code") as string)?.trim() ?? "";

  if (!rawNumber || typeof rawNumber !== "string") {
    return { status: "error", message: "رجاءً أدخل رقم واتسابك." };
  }

  const whatsappNumber = normalizeWhatsAppNumber(rawNumber);

  if (whatsappNumber.length < 10 || whatsappNumber.length > 15) {
    return {
      status: "error",
      message:
        "رقم واتساب غير صالح. تأكد من إدخال الرقم مع رمز البلد (مثال: 9639xxxxxxxx).",
    };
  }

  const supabase = createAdminClient();
  const isDemoStudent =
    whatsappNumber === DEMO_STUDENT.whatsapp_number && !teacherCode;
  const isDemoTeacher =
    whatsappNumber === DEMO_TEACHER.whatsapp_number && !teacherCode;

  const { data: existing, error: fetchError } = await supabase
    .from("profiles")
    .select("*")
    .eq("whatsapp_number", whatsappNumber)
    .maybeSingle<Profile>();

  if (fetchError) {
    return { status: "error", message: "صار في مشكلة بالاتصال. جرّب مرة تانية." };
  }

  let profile = existing;
  let linkedTeacherId: string | null = null;

  if (!profile) {
    if (!teacherCode && !isDemoStudent && !isDemoTeacher) {
      return {
        status: "error",
        message: "رجاءً أدخل رمز الأستاذ (teacher code) للتسجيل كطالب جديد.",
      };
    }

    const codeToUse = isDemoStudent || isDemoTeacher ? "AlMoayed-DEMO" : teacherCode;

    const { data: teacher } = await supabase
      .from("profiles")
      .select("id")
      .eq("teacher_code", codeToUse)
      .eq("role", "TEACHER")
      .maybeSingle();

    if (!teacher) {
      return {
        status: "error",
        message: "رمز الأستاذ غير صحيح. تأكد من الكود اللي أعطاك ياه الأستاذ.",
      };
    }

    linkedTeacherId = teacher.id;

    const { data: created, error: createError } = await supabase
      .from("profiles")
      .insert({
        whatsapp_number: whatsappNumber,
        full_name: fullName || "طالب",
        role: "STUDENT",
        is_subscribed: isDemoStudent,
      })
      .select()
      .single<Profile>();

    if (createError || !created) {
      return { status: "error", message: "ما قدرنا نسجّل حسابك. حاول مرة تانية." };
    }

    await supabase.from("student_teachers").insert({
      student_id: created.id,
      teacher_id: teacher.id,
      status: isDemoStudent ? "active" : "pending",
      tier: "free",
    });

    profile = created;
  } else if (profile.role === "STUDENT" && teacherCode) {
    const { data: teacher } = await supabase
      .from("profiles")
      .select("id")
      .eq("teacher_code", teacherCode)
      .eq("role", "TEACHER")
      .maybeSingle();

    if (teacher) {
      await supabase.from("student_teachers").upsert(
        {
          student_id: profile.id,
          teacher_id: teacher.id,
          status: "pending",
          tier: "free",
        },
        { onConflict: "student_id,teacher_id" }
      );
      linkedTeacherId = teacher.id;
    }
  }

  if (profile.role === "STUDENT") {
    const { data: activeLink } = await supabase
      .from("student_teachers")
      .select("teacher_id, status")
      .eq("student_id", profile.id)
      .eq("status", "active")
      .order("created_at", { ascending: true })
      .limit(1)
      .maybeSingle();

    if (activeLink) {
      linkedTeacherId = activeLink.teacher_id;
    }

    if (!profile.is_subscribed && !activeLink && !isDemoStudent) {
      const token = profile.verification_token ?? "";
      return {
        status: "needs_verification",
        verificationUrl: buildTeacherVerificationUrl(
          whatsappNumber,
          token,
          profile.full_name || fullName
        ),
        message:
          "حسابك لسه ما تفعّل. أرسل رسالة واتساب للأستاذ حتى يفعّل اشتراكك وتقدر تدخل على الاختبارات.",
      };
    }

    if (!profile.is_subscribed && activeLink) {
      await supabase
        .from("profiles")
        .update({ is_subscribed: true })
        .eq("id", profile.id);
    }
  }

  const role = await establishSession(profile, linkedTeacherId);
  return { status: "success", role };
}

export async function logout(): Promise<void> {
  const cookieStore = await cookies();
  const session = await getIronSession<SessionData>(cookieStore, sessionOptions);

  if (session.profileId) {
    const supabase = createAdminClient();
    await supabase
      .from("profiles")
      .update({ last_session_id: null })
      .eq("id", session.profileId);
  }

  Object.assign(session, defaultSession);
  await session.save();
  redirect("/login");
}