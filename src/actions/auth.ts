"use server";

import { getIronSession } from "iron-session";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  defaultSession,
  sessionOptions,
  type SessionData,
} from "@/lib/session";
import {
  buildTeacherVerificationUrl,
  normalizeWhatsAppNumber,
} from "@/lib/constants";
import type { Profile } from "@/types/database";

export type LoginState =
  | { status: "success" }
  | { status: "needs_verification"; verificationUrl: string; message: string }
  | { status: "error"; message: string };

export async function loginWithWhatsApp(
  _prev: LoginState | null,
  formData: FormData
): Promise<LoginState> {
  const rawNumber = formData.get("whatsapp_number");
  const fullName = (formData.get("full_name") as string)?.trim() ?? "";

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

  const { data: existing, error: fetchError } = await supabase
    .from("profiles")
    .select("*")
    .eq("whatsapp_number", whatsappNumber)
    .maybeSingle<Profile>();

  if (fetchError) {
    return { status: "error", message: "صار في مشكلة بالاتصال. جرّب مرة تانية." };
  }

  let profile = existing;

  if (!profile) {
    const { data: created, error: createError } = await supabase
      .from("profiles")
      .insert({
        whatsapp_number: whatsappNumber,
        full_name: fullName || "طالب",
        role: "STUDENT",
        is_subscribed: false,
      })
      .select()
      .single<Profile>();

    if (createError || !created) {
      return { status: "error", message: "ما قدرنا نسجّل حسابك. حاول مرة تانية." };
    }
    profile = created;
  }

  if (!profile.is_subscribed) {
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

  const cookieStore = await cookies();
  const session = await getIronSession<SessionData>(cookieStore, sessionOptions);

  session.profileId = profile.id;
  session.whatsappNumber = profile.whatsapp_number;
  session.fullName = profile.full_name;
  session.role = profile.role;
  session.isLoggedIn = true;

  await session.save();

  return { status: "success" };
}

export async function logout(): Promise<void> {
  const cookieStore = await cookies();
  const session = await getIronSession<SessionData>(cookieStore, sessionOptions);
  Object.assign(session, defaultSession);
  await session.save();
  redirect("/login");
}
