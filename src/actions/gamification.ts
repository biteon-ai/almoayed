"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireStudent, requireTeacher, getActiveTeacherId } from "@/lib/auth";
import {
  computeTeacherGamificationStatus,
  toLadderInputs,
  validateGamificationLadder,
  type TeacherGamificationStatus,
} from "@/lib/teacher-gamification";
import {
  GAMIFICATION_TIER_SELECT,
} from "@/lib/perf-selects";
import type {
  ActionResult,
  GamificationTier,
  GamificationTierSaveInput,
} from "@/types/database";

export async function getGamificationTiers(): Promise<GamificationTier[]> {
  const session = await requireTeacher();
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("gamification_tiers")
    .select(GAMIFICATION_TIER_SELECT)
    .eq("teacher_id", session.profileId)
    .order("level_number", { ascending: true });

  if (error) {
    console.error("[GAMIF-001] getGamificationTiers", error);
    return [];
  }

  return (data ?? []).map(mapTierRow);
}

export async function saveGamificationTiers(
  tiers: GamificationTierSaveInput[]
): Promise<ActionResult> {
  const session = await requireTeacher();
  const validation = validateGamificationLadder(toLadderInputs(tiers));
  if (!validation.ok) {
    return { ok: false, error: validation.error };
  }

  const supabase = createAdminClient();
  const teacherId = session.profileId;

  const { error: deleteError } = await supabase
    .from("gamification_tiers")
    .delete()
    .eq("teacher_id", teacherId);

  if (deleteError) {
    console.error("[GAMIF-001] saveGamificationTiers delete", deleteError);
    return { ok: false, error: "تعذر حفظ المستويات. حاول مرة أخرى." };
  }

  if (tiers.length > 0) {
    const now = new Date().toISOString();
    const rows = tiers.map((tier, index) => ({
      teacher_id: teacherId,
      level_number: index + 1,
      level_name: tier.levelName.trim(),
      min_completed_quizzes: tier.minCompletedQuizzes,
      min_avg_score: tier.minAvgScore,
      icon_type: tier.iconType,
      created_at: now,
      updated_at: now,
    }));

    const { error: insertError } = await supabase
      .from("gamification_tiers")
      .insert(rows);

    if (insertError) {
      console.error("[GAMIF-001] saveGamificationTiers insert", insertError);
      return { ok: false, error: "تعذر حفظ المستويات. حاول مرة أخرى." };
    }
  }

  revalidatePath("/teacher/settings/gamification");
  revalidatePath("/teacher/settings");
  revalidatePath("/dashboard");
  revalidatePath("/results");

  return { ok: true };
}

export async function getStudentGamificationStatus(): Promise<TeacherGamificationStatus | null> {
  const session = await requireStudent();
  const teacherId = await getActiveTeacherId(session);
  if (!teacherId) return null;

  const supabase = createAdminClient();

  const { data: link } = await supabase
    .from("student_teachers")
    .select("id")
    .eq("student_id", session.profileId)
    .eq("teacher_id", teacherId)
    .eq("status", "active")
    .maybeSingle();

  if (!link) return null;

  const { data: tierRows, error: tierError } = await supabase
    .from("gamification_tiers")
    .select(GAMIFICATION_TIER_SELECT)
    .eq("teacher_id", teacherId)
    .order("level_number", { ascending: true });

  if (tierError) {
    console.error("[GAMIF-001] getStudentGamificationStatus tiers", tierError);
    return null;
  }

  const tiers = (tierRows ?? []).map(mapTierRow);
  if (tiers.length === 0) return null;

  const { data: quizzes } = await supabase
    .from("quizzes")
    .select("id")
    .eq("created_by", teacherId);

  const quizIds = (quizzes ?? []).map((q) => q.id as string);
  if (quizIds.length === 0) {
    return computeTeacherGamificationStatus({ tiers, submissions: [] });
  }

  const { data: submissions, error: subError } = await supabase
    .from("exam_submissions")
    .select("quiz_id, score")
    .eq("student_id", session.profileId)
    .in("quiz_id", quizIds);

  if (subError) {
    console.error(
      "[GAMIF-001] getStudentGamificationStatus submissions",
      subError
    );
    return computeTeacherGamificationStatus({ tiers, submissions: [] });
  }

  return computeTeacherGamificationStatus({
    tiers,
    submissions: (submissions ?? []).map((s) => ({
      quizId: s.quiz_id as string,
      score: Number(s.score),
    })),
  });
}

function mapTierRow(row: Record<string, unknown>): GamificationTier {
  return {
    id: row.id as string,
    teacher_id: row.teacher_id as string,
    level_number: Number(row.level_number),
    level_name: row.level_name as string,
    min_completed_quizzes: Number(row.min_completed_quizzes),
    min_avg_score: Number(row.min_avg_score),
    icon_type: row.icon_type as GamificationTier["icon_type"],
    created_at: row.created_at as string,
    updated_at: row.updated_at as string,
  };
}
