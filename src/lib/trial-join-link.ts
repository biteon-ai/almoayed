import type { createAdminClient } from "@/lib/supabase/admin";

type AdminClient = ReturnType<typeof createAdminClient>;

/**
 * Upsert student↔teacher link as active. Preserves existing `pro` tier when requested.
 * AUTH-008 / MT-001
 */
export async function upsertActiveStudentTeacherLink(
  supabase: AdminClient,
  studentId: string,
  teacherId: string,
  options?: { preserveProTier?: boolean }
): Promise<{ ok: true } | { ok: false; error: string }> {
  const { data: existing, error: lookupErr } = await supabase
    .from("student_teachers")
    .select("id, tier, status")
    .eq("student_id", studentId)
    .eq("teacher_id", teacherId)
    .maybeSingle<{ id: string; tier: string; status: string }>();

  if (lookupErr) {
    return { ok: false, error: lookupErr.message };
  }

  if (existing) {
    const tier =
      options?.preserveProTier && existing.tier === "pro" ? "pro" : existing.tier;
    const { error: updateErr } = await supabase
      .from("student_teachers")
      .update({ status: "active", tier })
      .eq("id", existing.id);

    if (updateErr) {
      return { ok: false, error: updateErr.message };
    }
    return { ok: true };
  }

  const { error: insertErr } = await supabase.from("student_teachers").insert({
    student_id: studentId,
    teacher_id: teacherId,
    status: "active",
    tier: "free",
    upgrade_requested: false,
  });

  if (insertErr) {
    return { ok: false, error: insertErr.message };
  }

  return { ok: true };
}
