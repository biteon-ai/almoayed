-- المؤيد — Multi-Tenant Teacher Dashboard Schema
-- Migration 003

-- ─────────────────────────────────────────────
-- ENUMS
-- ─────────────────────────────────────────────
CREATE TYPE student_teacher_status AS ENUM ('pending', 'active', 'deactivated');
CREATE TYPE student_tier AS ENUM ('free', 'pro');
CREATE TYPE quiz_type AS ENUM ('regular', 'session_group');

-- ─────────────────────────────────────────────
-- PROFILES EXTENSIONS
-- ─────────────────────────────────────────────
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS school_name TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS address TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS bank_details JSONB NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS teacher_code TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS last_session_id TEXT;

CREATE INDEX IF NOT EXISTS idx_profiles_teacher_code ON profiles (teacher_code);
CREATE INDEX IF NOT EXISTS idx_profiles_last_session_id ON profiles (last_session_id);

-- Auto-generate teacher_code for teachers
CREATE OR REPLACE FUNCTION generate_teacher_code()
RETURNS TEXT AS $$
DECLARE
  code TEXT;
  exists_already BOOLEAN;
BEGIN
  LOOP
    code := 'AlMoayed-' || upper(substring(replace(gen_random_uuid()::text, '-', '') from 1 for 4));
    SELECT EXISTS(SELECT 1 FROM profiles WHERE teacher_code = code) INTO exists_already;
    EXIT WHEN NOT exists_already;
  END LOOP;
  RETURN code;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION set_teacher_code_on_insert()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.role = 'TEACHER' AND NEW.teacher_code IS NULL THEN
    NEW.teacher_code := generate_teacher_code();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS profiles_set_teacher_code ON profiles;
CREATE TRIGGER profiles_set_teacher_code
  BEFORE INSERT ON profiles
  FOR EACH ROW EXECUTE FUNCTION set_teacher_code_on_insert();

-- Backfill existing teachers
UPDATE profiles
SET teacher_code = generate_teacher_code()
WHERE role = 'TEACHER' AND teacher_code IS NULL;

-- ─────────────────────────────────────────────
-- TEACHER GROUPS
-- ─────────────────────────────────────────────
CREATE TABLE teacher_groups (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id  UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  group_name  TEXT NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_teacher_groups_teacher_id ON teacher_groups (teacher_id);

CREATE TABLE teacher_group_members (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id    UUID NOT NULL REFERENCES teacher_groups(id) ON DELETE CASCADE,
  student_id  UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT teacher_group_members_unique UNIQUE (group_id, student_id)
);

CREATE INDEX idx_teacher_group_members_group_id ON teacher_group_members (group_id);
CREATE INDEX idx_teacher_group_members_student_id ON teacher_group_members (student_id);

-- ─────────────────────────────────────────────
-- STUDENT ↔ TEACHER (many-to-many)
-- ─────────────────────────────────────────────
CREATE TABLE student_teachers (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id        UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  teacher_id        UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  status            student_teacher_status NOT NULL DEFAULT 'pending',
  tier              student_tier NOT NULL DEFAULT 'free',
  upgrade_requested BOOLEAN NOT NULL DEFAULT FALSE,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT student_teachers_unique UNIQUE (student_id, teacher_id)
);

CREATE INDEX idx_student_teachers_student_id ON student_teachers (student_id);
CREATE INDEX idx_student_teachers_teacher_id ON student_teachers (teacher_id);
CREATE INDEX idx_student_teachers_status ON student_teachers (status);
CREATE INDEX idx_student_teachers_tier ON student_teachers (tier);
CREATE INDEX idx_student_teachers_upgrade_requested ON student_teachers (upgrade_requested);

CREATE TRIGGER student_teachers_updated_at
  BEFORE UPDATE ON student_teachers
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ─────────────────────────────────────────────
-- CATEGORIES & TOPICS
-- ─────────────────────────────────────────────
CREATE TABLE categories (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id  UUID REFERENCES profiles(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  is_global   BOOLEAN NOT NULL DEFAULT FALSE,
  sort_order  INTEGER NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_categories_teacher_id ON categories (teacher_id);
CREATE INDEX idx_categories_is_global ON categories (is_global);

CREATE TABLE topics (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id UUID NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  sort_order  INTEGER NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_topics_category_id ON topics (category_id);

-- ─────────────────────────────────────────────
-- QUIZZES EXTENSIONS
-- ─────────────────────────────────────────────
ALTER TABLE quizzes
  ADD COLUMN IF NOT EXISTS category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS topic_id UUID REFERENCES topics(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS is_free BOOLEAN NOT NULL DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS quiz_type quiz_type NOT NULL DEFAULT 'regular',
  ADD COLUMN IF NOT EXISTS target_group_id UUID REFERENCES teacher_groups(id) ON DELETE SET NULL;

CREATE INDEX idx_quizzes_category_id ON quizzes (category_id);
CREATE INDEX idx_quizzes_topic_id ON quizzes (topic_id);
CREATE INDEX idx_quizzes_is_active ON quizzes (is_active);
CREATE INDEX idx_quizzes_is_free ON quizzes (is_free);
CREATE INDEX idx_quizzes_quiz_type ON quizzes (quiz_type);
CREATE INDEX idx_quizzes_target_group_id ON quizzes (target_group_id);

-- ─────────────────────────────────────────────
-- RLS (defense-in-depth — server uses service role)
-- ─────────────────────────────────────────────
ALTER TABLE teacher_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE teacher_group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_teachers ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE topics ENABLE ROW LEVEL SECURITY;

-- Global default math category (available to all teachers)
INSERT INTO categories (id, teacher_id, name, is_global, sort_order)
VALUES ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', NULL, 'رياضيات', TRUE, 1)
ON CONFLICT DO NOTHING;

INSERT INTO topics (category_id, name, sort_order)
SELECT 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', t.name, t.sort_order
FROM (VALUES
  ('أشعة', 1),
  ('عقدية', 2),
  ('تفاضل', 3),
  ('تكامل', 4)
) AS t(name, sort_order)
WHERE NOT EXISTS (
  SELECT 1 FROM topics
  WHERE category_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'
    AND name = t.name
);
