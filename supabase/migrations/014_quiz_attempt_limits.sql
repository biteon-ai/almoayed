-- QUIZ-005: Quiz category (assessment) + max attempts + multi-submit

CREATE TYPE assessment_category AS ENUM ('practice', 'evaluation', 'challenge');

ALTER TABLE quizzes
  ADD COLUMN IF NOT EXISTS assessment_category assessment_category NOT NULL DEFAULT 'evaluation',
  ADD COLUMN IF NOT EXISTS max_attempts INTEGER NOT NULL DEFAULT 1
    CHECK (max_attempts = 0 OR (max_attempts BETWEEN 1 AND 10));

UPDATE quizzes
SET assessment_category = 'evaluation',
    max_attempts = 1
WHERE assessment_category IS NULL OR max_attempts IS NULL;

ALTER TABLE exam_submissions
  DROP CONSTRAINT IF EXISTS exam_submissions_student_quiz_unique;

CREATE INDEX IF NOT EXISTS idx_exam_submissions_student_quiz_submitted
  ON exam_submissions (student_id, quiz_id, submitted_at DESC);

CREATE INDEX IF NOT EXISTS idx_exam_submissions_quiz_score_submitted
  ON exam_submissions (quiz_id, score DESC, submitted_at ASC);
