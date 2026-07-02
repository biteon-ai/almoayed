-- المؤيد (Al-Moayed) — Initial Schema
-- Syrian Baccalaureate Math Platform
-- Uses built-in gen_random_uuid() (no pgcrypto — Supabase installs it in extensions schema)

CREATE TYPE user_role AS ENUM ('TEACHER', 'STUDENT');

CREATE TABLE profiles (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  whatsapp_number TEXT NOT NULL,
  full_name       TEXT NOT NULL DEFAULT '',
  role            user_role NOT NULL DEFAULT 'STUDENT',
  is_subscribed   BOOLEAN NOT NULL DEFAULT FALSE,
  verification_token TEXT UNIQUE DEFAULT replace(gen_random_uuid()::text, '-', ''),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT profiles_whatsapp_number_unique UNIQUE (whatsapp_number),
  CONSTRAINT profiles_whatsapp_format CHECK (whatsapp_number ~ '^[0-9]{10,15}$')
);

CREATE INDEX idx_profiles_whatsapp_number ON profiles (whatsapp_number);
CREATE INDEX idx_profiles_role ON profiles (role);
CREATE INDEX idx_profiles_is_subscribed ON profiles (is_subscribed);

CREATE TABLE quizzes (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title       TEXT NOT NULL,
  created_by  UUID NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_quizzes_created_by ON quizzes (created_by);

CREATE TABLE questions (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quiz_id               UUID NOT NULL REFERENCES quizzes(id) ON DELETE CASCADE,
  question_text         TEXT NOT NULL,
  question_image_url    TEXT,
  options               JSONB NOT NULL DEFAULT '[]'::jsonb,
  correct_answer        TEXT NOT NULL,
  explanation_text      TEXT NOT NULL DEFAULT '',
  explanation_media_url TEXT,
  category_tag          TEXT NOT NULL DEFAULT 'عام',
  sort_order            INTEGER NOT NULL DEFAULT 0,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT questions_options_is_array CHECK (jsonb_typeof(options) = 'array')
);

CREATE INDEX idx_questions_quiz_id ON questions (quiz_id);
CREATE INDEX idx_questions_category_tag ON questions (category_tag);

CREATE TABLE exam_submissions (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id   UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  quiz_id      UUID NOT NULL REFERENCES quizzes(id) ON DELETE CASCADE,
  score        INTEGER NOT NULL DEFAULT 0 CHECK (score >= 0 AND score <= 100),
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT exam_submissions_student_quiz_unique UNIQUE (student_id, quiz_id)
);

CREATE INDEX idx_exam_submissions_student_id ON exam_submissions (student_id);
CREATE INDEX idx_exam_submissions_quiz_id ON exam_submissions (quiz_id);
CREATE INDEX idx_exam_submissions_submitted_at ON exam_submissions (submitted_at DESC);

CREATE TABLE student_answers (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  submission_id   UUID NOT NULL REFERENCES exam_submissions(id) ON DELETE CASCADE,
  question_id     UUID NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
  student_answer  TEXT NOT NULL,
  is_correct      BOOLEAN NOT NULL DEFAULT FALSE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT student_answers_submission_question_unique UNIQUE (submission_id, question_id)
);

CREATE INDEX idx_student_answers_submission_id ON student_answers (submission_id);
CREATE INDEX idx_student_answers_question_id ON student_answers (question_id);
CREATE INDEX idx_student_answers_is_correct ON student_answers (is_correct);

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER quizzes_updated_at
  BEFORE UPDATE ON quizzes
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE quizzes ENABLE ROW LEVEL SECURITY;
ALTER TABLE questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE exam_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_answers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "profiles_select_own"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "profiles_update_own"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "quizzes_select_subscribed"
  ON quizzes FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND (profiles.is_subscribed = TRUE OR profiles.role = 'TEACHER')
    )
  );

CREATE POLICY "questions_select_subscribed"
  ON questions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND (profiles.is_subscribed = TRUE OR profiles.role = 'TEACHER')
    )
  );

CREATE POLICY "exam_submissions_select_own"
  ON exam_submissions FOR SELECT
  USING (student_id = auth.uid());

CREATE POLICY "exam_submissions_insert_own"
  ON exam_submissions FOR INSERT
  WITH CHECK (student_id = auth.uid());

CREATE POLICY "student_answers_select_own"
  ON student_answers FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM exam_submissions es
      WHERE es.id = submission_id AND es.student_id = auth.uid()
    )
  );

CREATE POLICY "student_answers_insert_own"
  ON student_answers FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM exam_submissions es
      WHERE es.id = submission_id AND es.student_id = auth.uid()
    )
  );

CREATE OR REPLACE VIEW student_category_performance AS
SELECT
  es.student_id,
  q.category_tag,
  COUNT(*)::INTEGER AS total_attempted,
  COUNT(*) FILTER (WHERE sa.is_correct)::INTEGER AS correct_count,
  ROUND(
    (COUNT(*) FILTER (WHERE sa.is_correct)::NUMERIC / NULLIF(COUNT(*), 0)) * 100,
    1
  ) AS success_percentage
FROM student_answers sa
JOIN exam_submissions es ON es.id = sa.submission_id
JOIN questions q ON q.id = sa.question_id
GROUP BY es.student_id, q.category_tag;
