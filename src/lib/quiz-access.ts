import type { Quiz, QuizListItem, StudentTier } from "@/types/database";

export interface QuizAccessContext {
  tier: StudentTier;
  groupIds: string[];
}

/** Resolve assigned group ids (junction table preferred; legacy target_group_id fallback). */
export function resolveQuizAssignedGroupIds(
  quiz: Pick<Quiz, "target_group_id">,
  assignedGroupIds?: string[]
): string[] {
  if (assignedGroupIds !== undefined) {
    if (assignedGroupIds.length > 0) return assignedGroupIds;
    return quiz.target_group_id ? [quiz.target_group_id] : [];
  }
  return quiz.target_group_id ? [quiz.target_group_id] : [];
}

/**
 * Group visibility rule:
 * - No assigned groups → public (visible to all students)
 * - Has assigned groups → visible only if student belongs to at least one
 */
export function isQuizGroupAccessible(
  quiz: Pick<Quiz, "target_group_id">,
  studentGroupIds: string[],
  assignedGroupIds?: string[]
): boolean {
  const assigned = resolveQuizAssignedGroupIds(quiz, assignedGroupIds);
  if (assigned.length === 0) return true;
  return assigned.some((id) => studentGroupIds.includes(id));
}

/** Alias for list/catalog filtering — same rule as group access. */
export function isQuizVisibleToStudent(
  quiz: Pick<Quiz, "target_group_id">,
  studentGroupIds: string[],
  assignedGroupIds?: string[]
): boolean {
  return isQuizGroupAccessible(quiz, studentGroupIds, assignedGroupIds);
}

/** [TIER-001 / MT-002] Compute student-facing quiz accessibility for active tenant. */
export function computeQuizListItem(
  quiz: Quiz,
  ctx: QuizAccessContext,
  assignedGroupIds?: string[]
): QuizListItem {
  const isGroupOk = isQuizGroupAccessible(quiz, ctx.groupIds, assignedGroupIds);

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

/** Build map quizId → assigned group ids from junction rows. */
export function indexQuizGroupAssignments(
  rows: Array<{ quiz_id: string; group_id: string }>
): Map<string, string[]> {
  const map = new Map<string, string[]>();
  for (const row of rows) {
    const list = map.get(row.quiz_id) ?? [];
    list.push(row.group_id);
    map.set(row.quiz_id, list);
  }
  return map;
}

/** Filter quizzes to those visible to the student based on group assignments. */
export function filterQuizzesVisibleToStudent<T extends Pick<Quiz, "id" | "target_group_id">>(
  quizzes: T[],
  studentGroupIds: string[],
  assignmentsByQuiz: Map<string, string[]>
): T[] {
  return quizzes.filter((quiz) =>
    isQuizVisibleToStudent(
      quiz,
      studentGroupIds,
      assignmentsByQuiz.get(quiz.id) ?? []
    )
  );
}
