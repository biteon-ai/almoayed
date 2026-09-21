-- QUIZ-006: per-attempt question/option presentation (live taking + submission snapshot)

CREATE TABLE IF NOT EXISTS quiz_attempt_presentations (
  student_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  quiz_id UUID NOT NULL REFERENCES quizzes(id) ON DELETE CASCADE,
  question_ids UUID[] NOT NULL,
  option_orders JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (student_id, quiz_id)
);

CREATE INDEX IF NOT EXISTS idx_quiz_attempt_presentations_quiz_id
  ON quiz_attempt_presentations (quiz_id);

COMMENT ON TABLE quiz_attempt_presentations IS
  'QUIZ-006: in-flight shuffled question/option order for one student+quiz taking session';

ALTER TABLE quiz_attempt_presentations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "quiz_attempt_presentations_select_own" ON quiz_attempt_presentations;
CREATE POLICY "quiz_attempt_presentations_select_own"
  ON quiz_attempt_presentations FOR SELECT
  USING (auth.uid() = student_id);

DROP POLICY IF EXISTS "quiz_attempt_presentations_insert_own" ON quiz_attempt_presentations;
CREATE POLICY "quiz_attempt_presentations_insert_own"
  ON quiz_attempt_presentations FOR INSERT
  WITH CHECK (auth.uid() = student_id);

DROP POLICY IF EXISTS "quiz_attempt_presentations_update_own" ON quiz_attempt_presentations;
CREATE POLICY "quiz_attempt_presentations_update_own"
  ON quiz_attempt_presentations FOR UPDATE
  USING (auth.uid() = student_id)
  WITH CHECK (auth.uid() = student_id);

DROP POLICY IF EXISTS "quiz_attempt_presentations_delete_own" ON quiz_attempt_presentations;
CREATE POLICY "quiz_attempt_presentations_delete_own"
  ON quiz_attempt_presentations FOR DELETE
  USING (auth.uid() = student_id);

ALTER TABLE exam_submissions
  ADD COLUMN IF NOT EXISTS question_order UUID[] NULL;

ALTER TABLE exam_submissions
  ADD COLUMN IF NOT EXISTS option_orders JSONB NULL;

COMMENT ON COLUMN exam_submissions.question_order IS
  'QUIZ-006: question IDs in the order shown on this graded attempt; NULL = legacy authored order';
COMMENT ON COLUMN exam_submissions.option_orders IS
  'QUIZ-006: map of question_id → option texts in display order; NULL = legacy authored options';
