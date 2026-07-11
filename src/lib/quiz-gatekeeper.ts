import type { ExamQuestion, Question } from "@/types/database";

/** Fields that must never appear in pre-submission exam payloads [QUIZ-001]. */
export const GATEKEEPER_FORBIDDEN_FIELDS = [
  "correct_answer",
  "explanation_text",
  "explanation_media_url",
  "category_tag",
] as const;

export type GatekeeperForbiddenField =
  (typeof GATEKEEPER_FORBIDDEN_FIELDS)[number];

/** Supabase select string used before submission — gatekeeper contract. */
export const EXAM_QUESTION_SELECT_FIELDS =
  "id, quiz_id, question_text, question_image_url, options, sort_order";

export function toExamQuestion(row: Question): ExamQuestion {
  return {
    id: row.id,
    quiz_id: row.quiz_id,
    question_text: row.question_text,
    question_image_url: row.question_image_url,
    options: row.options,
    sort_order: row.sort_order,
  };
}

export function assertGatekeeperCompliance(questions: ExamQuestion[]): void {
  for (const question of questions) {
    for (const field of GATEKEEPER_FORBIDDEN_FIELDS) {
      if (field in question) {
        throw new Error(
          `[QUIZ-001] Solution leaked prior to submission: forbidden field "${field}"`
        );
      }
    }
  }
}
