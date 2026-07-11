"use server";

import { getIronSession } from "iron-session";
import { cookies } from "next/headers";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  authError,
  AuthErrorCode,
  logAuthFailure,
} from "@/lib/auth-error-codes";
import { generateSessionToken } from "@/lib/session-token";
import { sessionOptions, type SessionData } from "@/lib/session";
import {
  buildTeacherVerificationUrl,
  DEMO_STUDENT,
  DEMO_TEACHER,
  normalizeWhatsAppNumber,
} from "@/lib/constants";
import type { Profile } from "@/types/database";
import type { LoginState } from "@/types/auth";

function getSupabaseClient() {
  try {
    return createAdminClient();
  } catch (error) {
    logAuthFailure("SUPABASE_ENV_MISSING", error);
    return null;
  }
}

async function establishSession(
  profile: Profile,
  teacherId: string | null
): Promise<LoginState | { role: "TEACHER" | "STUDENT" }> {
  const supabase = getSupabaseClient();
  if (!supabase) {
    return authError(AuthErrorCode.SUPABASE_ENV_MISSING);
  }

  const sessionToken = generateSessionToken();

  const { error: sessionUpdateError } = await supabase
    .from("profiles")
    .update({ last_session_id: sessionToken })
    .eq("id", profile.id);

  if (sessionUpdateError) {
    logAuthFailure("SUPABASE_SESSION_UPDATE_FAILED", sessionUpdateError);
    return authError(AuthErrorCode.SUPABASE_SESSION_UPDATE_FAILED);
  }

  try {
    const cookieStore = await cookies();
    const session = await getIronSession<SessionData>(
      cookieStore,
      sessionOptions
    );

    session.profileId = profile.id;
    session.whatsappNumber = profile.whatsapp_number;
    session.fullName = profile.full_name;
    session.role = profile.role;
    session.isLoggedIn = true;
    session.sessionToken = sessionToken;
    session.currentTeacherId = teacherId;

    await session.save();
  } catch (error) {
    logAuthFailure("SESSION_SAVE_FAILED", error);
    return authError(AuthErrorCode.SESSION_SAVE_FAILED);
  }

  return { role: profile.role };
}

export async function loginWithWhatsApp(
  _prev: LoginState | null,
  formData: FormData
): Promise<LoginState> {
  try {
    return await loginWithWhatsAppImpl(formData);
  } catch (error) {
    logAuthFailure("LOGIN_UNEXPECTED", error);
    return authError(AuthErrorCode.LOGIN_UNEXPECTED);
  }
}

async function loginWithWhatsAppImpl(
  formData: FormData
): Promise<LoginState> {
  const rawNumber = formData.get("whatsapp_number");
  const fullName = (formData.get("full_name") as string)?.trim() ?? "";
  const teacherCode = (formData.get("teacher_code") as string)?.trim() ?? "";

  if (!rawNumber || typeof rawNumber !== "string") {
    return authError(AuthErrorCode.MISSING_WHATSAPP);
  }

  const whatsappNumber = normalizeWhatsAppNumber(rawNumber);

  if (whatsappNumber.length < 10 || whatsappNumber.length > 15) {
    return authError(AuthErrorCode.INVALID_WHATSAPP);
  }

  const supabase = getSupabaseClient();
  if (!supabase) {
    return authError(AuthErrorCode.SUPABASE_ENV_MISSING);
  }

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
    logAuthFailure("SUPABASE_PROFILE_FETCH_FAILED", fetchError);
    return authError(AuthErrorCode.SUPABASE_PROFILE_FETCH_FAILED);
  }

  let profile = existing;
  let linkedTeacherId: string | null = null;

  if (!profile) {
    if (!teacherCode && !isDemoStudent && !isDemoTeacher) {
      return authError(AuthErrorCode.TEACHER_CODE_REQUIRED);
    }

    const codeToUse =
      isDemoStudent || isDemoTeacher ? "AlMoayed-DEMO" : teacherCode;

    const { data: teacher, error: teacherLookupError } = await supabase
      .from("profiles")
      .select("id")
      .eq("teacher_code", codeToUse)
      .eq("role", "TEACHER")
      .maybeSingle();

    if (teacherLookupError) {
      logAuthFailure("SUPABASE_TEACHER_LOOKUP_FAILED", teacherLookupError);
      return authError(AuthErrorCode.SUPABASE_CONNECTION_ERROR);
    }

    if (!teacher) {
      return authError(AuthErrorCode.INVALID_TEACHER_CODE);
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
      logAuthFailure("SUPABASE_PROFILE_CREATE_FAILED", createError);
      return authError(AuthErrorCode.SUPABASE_PROFILE_CREATE_FAILED);
    }

    const { error: linkError } = await supabase
      .from("student_teachers")
      .insert({
        student_id: created.id,
        teacher_id: teacher.id,
        status: isDemoStudent ? "active" : "pending",
        tier: "free",
      });

    if (linkError) {
      logAuthFailure("SUPABASE_STUDENT_LINK_FAILED", linkError);
      return authError(AuthErrorCode.SUPABASE_STUDENT_LINK_FAILED);
    }

    profile = created;
  } else if (profile.role === "STUDENT" && teacherCode) {
    const { data: teacher, error: teacherLookupError } = await supabase
      .from("profiles")
      .select("id")
      .eq("teacher_code", teacherCode)
      .eq("role", "TEACHER")
      .maybeSingle();

    if (teacherLookupError) {
      logAuthFailure("SUPABASE_TEACHER_LOOKUP_FAILED", teacherLookupError);
      return authError(AuthErrorCode.SUPABASE_CONNECTION_ERROR);
    }

    if (teacher) {
      const { error: upsertError } = await supabase
        .from("student_teachers")
        .upsert(
          {
            student_id: profile.id,
            teacher_id: teacher.id,
            status: "pending",
            tier: "free",
          },
          { onConflict: "student_id,teacher_id" }
        );

      if (upsertError) {
        logAuthFailure("SUPABASE_STUDENT_LINK_FAILED", upsertError);
        return authError(AuthErrorCode.SUPABASE_STUDENT_LINK_FAILED);
      }

      linkedTeacherId = teacher.id;
    }
  }

  if (profile.role === "STUDENT") {
    const { data: activeLink, error: linkFetchError } = await supabase
      .from("student_teachers")
      .select("teacher_id, status")
      .eq("student_id", profile.id)
      .eq("status", "active")
      .order("created_at", { ascending: true })
      .limit(1)
      .maybeSingle();

    if (linkFetchError) {
      logAuthFailure("SUPABASE_STUDENT_LINK_FETCH_FAILED", linkFetchError);
      return authError(AuthErrorCode.SUPABASE_CONNECTION_ERROR);
    }

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
        code: AuthErrorCode.ACCOUNT_PENDING_VERIFICATION,
      };
    }

    if (!profile.is_subscribed && activeLink) {
      const { error: subscribeError } = await supabase
        .from("profiles")
        .update({ is_subscribed: true })
        .eq("id", profile.id);

      if (subscribeError) {
        logAuthFailure("SUPABASE_SUBSCRIBE_UPDATE_FAILED", subscribeError);
        return authError(AuthErrorCode.SUPABASE_CONNECTION_ERROR);
      }
    }
  }

  const sessionResult = await establishSession(profile, linkedTeacherId);

  if ("status" in sessionResult && sessionResult.status === "error") {
    return sessionResult;
  }

  const { role } = sessionResult as { role: "TEACHER" | "STUDENT" };
  return { status: "success", role };
}
