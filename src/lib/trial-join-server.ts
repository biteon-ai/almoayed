import { logAuthFailure } from "@/lib/auth-error-codes";
import {
  getAuthSupabaseClient,
  type AuthSupabaseClient,
} from "@/lib/auth-session";
import {
  normalizeTeacherJoinCode,
  type ResolvedJoinTeacher,
} from "@/lib/trial-join";

async function enrichJoinTeacher(
  supabase: AuthSupabaseClient,
  row: { id: string; teacher_code: string | null }
): Promise<ResolvedJoinTeacher | null> {
  if (!row.teacher_code) return null;

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("full_name, teacher_account_status")
    .eq("id", row.id)
    .maybeSingle<{
      full_name: string;
      teacher_account_status: ResolvedJoinTeacher["teacher_account_status"];
    }>();

  if (error) {
    logAuthFailure("JOIN_TEACHER_PROFILE_FETCH_FAILED", error);
    return {
      id: row.id,
      teacher_code: row.teacher_code,
      full_name: "",
      teacher_account_status: "active",
    };
  }

  return {
    id: row.id,
    teacher_code: row.teacher_code,
    full_name: profile?.full_name ?? "",
    teacher_account_status: profile?.teacher_account_status ?? "active",
  };
}

export async function resolveTeacherForJoinCode(
  rawCode: string,
  supabaseClient?: AuthSupabaseClient | null
): Promise<ResolvedJoinTeacher | null> {
  const code = normalizeTeacherJoinCode(rawCode);
  if (!code) return null;

  const supabase = supabaseClient ?? getAuthSupabaseClient();
  if (!supabase) return null;

  const { data: exact, error: exactErr } = await supabase
    .from("profiles")
    .select("id, teacher_code")
    .eq("teacher_code", code)
    .eq("role", "TEACHER")
    .maybeSingle<{ id: string; teacher_code: string | null }>();

  if (exactErr) {
    logAuthFailure("JOIN_TEACHER_LOOKUP_FAILED", exactErr);
    return null;
  }
  if (exact) return enrichJoinTeacher(supabase, exact);

  const { data: teachers, error: listErr } = await supabase
    .from("profiles")
    .select("id, teacher_code")
    .eq("role", "TEACHER")
    .ilike("teacher_code", code);

  if (listErr) {
    logAuthFailure("JOIN_TEACHER_ILIKE_FAILED", listErr);
    return null;
  }

  const lower = code.toLowerCase();
  const matched = (teachers ?? []).find(
    (t) => t.teacher_code?.toLowerCase() === lower
  );
  if (!matched) return null;

  return enrichJoinTeacher(supabase, matched);
}
