import type { Quiz, QuizListItem, StudentTier } from "@/types/database";

export interface QuizAccessContext {
  tier: StudentTier;
  groupIds: string[];
}

/** [TIER-001 / MT-002] Compute student-facing quiz accessibility for active tenant. */
export function computeQuizListItem(
  quiz: Quiz,
  ctx: QuizAccessContext
): QuizListItem {
  const isGroupOk =
    quiz.quiz_type !== "session_group" ||
    !quiz.target_group_id ||
    ctx.groupIds.includes(quiz.target_group_id);

  const isAccessible = isGroupOk && (ctx.tier === "pro" || quiz.is_free);

  return {
    ...quiz,
    isAccessible,
    isLocked: !isAccessible && isGroupOk,
  };
}

/** [MT-002] Tenant boundary — quizzes must belong to the active teacher. */
export function filterQuizzesByTeacher(
  quizzes: Quiz[],
  teacherId: string
): Quiz[] {
  return quizzes.filter((quiz) => quiz.created_by === teacherId);
}
