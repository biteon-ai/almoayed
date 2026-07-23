import { getIronSession } from "iron-session";
import { cookies } from "next/headers";
import { createAdminClient } from "@/lib/supabase/admin";
import { generateSessionToken } from "@/lib/session-token";
import { sessionOptions, type SessionData } from "@/lib/session";
import type { Profile } from "@/types/database";
import {
  generateSecurePassword,
  hashPassword,
  isValidEmail,
  verifyPassword,
} from "@/lib/admin/passwords";

export async function ensureSuperAdminProfile(
  email: string,
  password: string
): Promise<Profile | null> {
  const normalizedEmail = email.trim().toLowerCase();
  if (!isValidEmail(normalizedEmail) || !password) return null;

  const envEmail = process.env.SUPER_ADMIN_EMAIL?.trim().toLowerCase();
  const envPassword = process.env.SUPER_ADMIN_PASSWORD?.trim();

  const supabase = createAdminClient();

  const { data: existing } = await supabase
    .from("profiles")
    .select("*")
    .eq("email", normalizedEmail)
    .eq("role", "SUPER_ADMIN")
    .maybeSingle<Profile>();

  if (existing?.password_hash) {
    const ok = await verifyPassword(password, existing.password_hash);
    return ok ? existing : null;
  }

  if (
    envEmail &&
    envPassword &&
    normalizedEmail === envEmail &&
    password === envPassword
  ) {
    const passwordHash = await hashPassword(password);
    if (existing) {
      const { data: updated } = await supabase
        .from("profiles")
        .update({ password_hash: passwordHash, full_name: existing.full_name || "Super Admin" })
        .eq("id", existing.id)
        .select("*")
        .single<Profile>();
      return updated ?? null;
    }

    const { data: created } = await supabase
      .from("profiles")
      .insert({
        email: normalizedEmail,
        password_hash: passwordHash,
        full_name: "Super Admin",
        role: "SUPER_ADMIN",
        whatsapp_number: null,
        auth_method: "email",
        is_subscribed: true,
      })
      .select("*")
      .single<Profile>();

    return created ?? null;
  }

  return null;
}

export async function establishSuperAdminSession(
  profile: Profile
): Promise<boolean> {
  const supabase = createAdminClient();
  const sessionToken = generateSessionToken();

  const { error } = await supabase
    .from("profiles")
    .update({ last_session_id: sessionToken })
    .eq("id", profile.id);

  if (error) return false;

  const cookieStore = await cookies();
  const session = await getIronSession<SessionData>(cookieStore, sessionOptions);

  session.profileId = profile.id;
  session.whatsappNumber = profile.whatsapp_number ?? "";
  session.fullName = profile.full_name;
  session.role = "SUPER_ADMIN";
  session.isLoggedIn = true;
  session.sessionToken = sessionToken;
  session.currentTeacherId = null;
  session.pendingTeacherLink = false;
  session.impersonation = undefined;

  await session.save();
  return true;
}

export async function loginTeacherWithEmail(
  email: string,
  password: string
): Promise<Profile | "inactive" | null> {
  const normalizedEmail = email.trim().toLowerCase();
  if (!isValidEmail(normalizedEmail) || !password) return null;

  const supabase = createAdminClient();
  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("email", normalizedEmail)
    .eq("role", "TEACHER")
    .maybeSingle<Profile>();

  if (!profile?.password_hash) return null;
  if (profile.teacher_account_status === "inactive") return "inactive";

  const ok = await verifyPassword(password, profile.password_hash);
  if (!ok) return null;

  return profile;
}

export async function generatePasswordForDisplay(): Promise<string> {
  return generateSecurePassword(12);
}
