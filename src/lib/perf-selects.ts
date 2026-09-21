/** [PERF-001 / PERF-002] Explicit column lists for list/dashboard reads — never use for pre-submit exam questions. */

/** Quiz row fields needed for list/access/dashboard (full Quiz shape, no related questions). */
export const QUIZ_LIST_SELECT =
  "id, title, created_by, category_id, topic_id, is_active, is_free, is_archived, deleted_at, quiz_type, target_group_id, is_timed, duration_minutes, assessment_category, max_attempts, created_at, updated_at" as const;

/** Lean submission fields for student/teacher dashboards (not full answer payloads). */
export const SUBMISSION_LIST_SELECT =
  "id, student_id, quiz_id, score, submitted_at" as const;

/** Teacher group list columns. */
export const TEACHER_GROUP_LIST_SELECT =
  "id, teacher_id, group_name, created_at" as const;

/** Category list columns. */
export const CATEGORY_LIST_SELECT =
  "id, name, teacher_id, is_global, sort_order, created_at" as const;

/** Topic list columns. */
export const TOPIC_LIST_SELECT =
  "id, category_id, name, sort_order, created_at" as const;

/** Gamification tier columns (no select *). */
export const GAMIFICATION_TIER_SELECT =
  "id, teacher_id, level_number, level_name, min_completed_quizzes, min_avg_score, icon_type, created_at, updated_at" as const;

/** Submission result header fields after exam submit (QUIZ-001 post-submit only). */
export const SUBMISSION_RESULT_SELECT =
  "id, student_id, quiz_id, score, submitted_at" as const;
