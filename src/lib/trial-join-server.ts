import { logAuthFailure } from "@/lib/auth-error-codes";
import {
  getAuthSupabaseClient,
  type AuthSupabaseClient,
} from "@/lib/auth-session";
import {
  normalizeTeacherJoinCode,
  type ResolvedJoinTeacher,
} from "@/lib/trial-join";

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
    .select("id, teacher_code, full_name, teacher_account_status")
    .eq("teacher_code", code)
    .eq("role", "TEACHER")
    .maybeSingle<ResolvedJoinTeacher>();

  if (exactErr) {
    logAuthFailure("JOIN_TEACHER_LOOKUP_FAILED", exactErr);
    return null;
  }
  if (exact) return exact;

  const { data: teachers, error: listErr } = await supabase
    .from("profiles")
    .select("id, teacher_code, full_name, teacher_account_status")
    .eq("role", "TEACHER")
    .ilike("teacher_code", code);

  if (listErr) {
    logAuthFailure("JOIN_TEACHER_ILIKE_FAILED", listErr);
    return null;
  }

  const lower = code.toLowerCase();
  return (
    (teachers ?? []).find(
      (t) => t.teacher_code?.toLowerCase() === lower
    ) as ResolvedJoinTeacher | undefined
  ) ?? null;
}
