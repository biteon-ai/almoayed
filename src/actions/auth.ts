"use server";

import { getIronSession } from "iron-session";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import {
  authError,
  AuthErrorCode,
  logAuthFailure,
} from "@/lib/auth-error-codes";
import {
  isAdminWhatsAppAllowed,
  verifyAdminFallbackSecret,
} from "@/lib/admin-fallback";
import {
  establishSession,
  getAuthSupabaseClient,
} from "@/lib/auth-session";
import { normalizeWhatsAppNumber } from "@/lib/constants";
import {
  defaultSession,
  sessionOptions,
  type SessionData,
} from "@/lib/session";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Profile } from "@/types/database";
import type { LoginState } from "@/types/auth";

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

/** AUTH-005: admin emergency login — WhatsApp + shared secret, allowlisted TEACHER. */
export async function loginAdminFallback(
  _prev: LoginState | null,
  formData: FormData
): Promise<LoginState> {
  try {
    return await loginAdminFallbackImpl(formData);
  } catch (error) {
    logAuthFailure("ADMIN_FALLBACK_UNEXPECTED", error);
    return authError(AuthErrorCode.ADMIN_FALLBACK_DENIED);
  }
}

async function loginAdminFallbackImpl(formData: FormData): Promise<LoginState> {
  const rawNumber = formData.get("whatsapp_number");
  const secret = (formData.get("admin_secret") as string) ?? "";

  if (!rawNumber || typeof rawNumber !== "string") {
    return authError(AuthErrorCode.ADMIN_FALLBACK_DENIED);
  }

  const whatsappNumber = normalizeWhatsAppNumber(rawNumber);

  if (!verifyAdminFallbackSecret(secret)) {
    logAuthFailure("ADMIN_FALLBACK_BAD_SECRET", { whatsappNumber });
    return authError(AuthErrorCode.ADMIN_FALLBACK_DENIED);
  }

  if (!isAdminWhatsAppAllowed(whatsappNumber)) {
    logAuthFailure("ADMIN_FALLBACK_NOT_ALLOWLISTED", { whatsappNumber });
    return authError(AuthErrorCode.ADMIN_FALLBACK_DENIED);
  }

  const supabase = getAuthSupabaseClient();
  if (!supabase) {
    return authError(AuthErrorCode.ADMIN_FALLBACK_DENIED);
  }

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("whatsapp_number", whatsappNumber)
    .eq("role", "TEACHER")
    .maybeSingle<Profile>();

  if (error || !profile) {
    logAuthFailure("ADMIN_FALLBACK_PROFILE_MISS", error);
    return authError(AuthErrorCode.ADMIN_FALLBACK_DENIED);
  }

  const sessionResult = await establishSession(profile, null);
  if ("status" in sessionResult && sessionResult.status === "error") {
    return authError(AuthErrorCode.ADMIN_FALLBACK_DENIED);
  }

  return { status: "success", role: "TEACHER" };
}
