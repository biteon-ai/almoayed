-- QUIZ-004: Quiz countdown timer settings + timed attempt sessions

ALTER TABLE quizzes
  ADD COLUMN IF NOT EXISTS is_timed BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE quizzes
  ADD COLUMN IF NOT EXISTS duration_minutes INTEGER NULL;

ALTER TABLE quizzes
  DROP CONSTRAINT IF EXISTS quizzes_duration_minutes_range;

ALTER TABLE quizzes
  ADD CONSTRAINT quizzes_duration_minutes_range
  CHECK (
    duration_minutes IS NULL
    OR (duration_minutes >= 1 AND duration_minutes <= 180)
  );

COMMENT ON COLUMN quizzes.is_timed IS 'QUIZ-004: teacher-enabled countdown timer';
COMMENT ON COLUMN quizzes.duration_minutes IS 'QUIZ-004: whole minutes 1–180 when is_timed; NULL when untimed';

CREATE TABLE IF NOT EXISTS quiz_timed_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  quiz_id UUID NOT NULL REFERENCES quizzes(id) ON DELETE CASCADE,
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  duration_minutes INTEGER NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT quiz_timed_sessions_student_quiz_unique UNIQUE (student_id, quiz_id),
  CONSTRAINT quiz_timed_sessions_duration_range
    CHECK (duration_minutes >= 1 AND duration_minutes <= 180)
);

CREATE INDEX IF NOT EXISTS idx_quiz_timed_sessions_quiz_id
  ON quiz_timed_sessions (quiz_id);

ALTER TABLE quiz_timed_sessions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "quiz_timed_sessions_select_own" ON quiz_timed_sessions;
CREATE POLICY "quiz_timed_sessions_select_own"
  ON quiz_timed_sessions FOR SELECT
  USING (auth.uid() = student_id);

DROP POLICY IF EXISTS "quiz_timed_sessions_insert_own" ON quiz_timed_sessions;
CREATE POLICY "quiz_timed_sessions_insert_own"
  ON quiz_timed_sessions FOR INSERT
  WITH CHECK (auth.uid() = student_id);
