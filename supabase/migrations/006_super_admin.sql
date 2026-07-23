-- المؤيد — Super Admin Dashboard (ADMIN-001)
-- Migration 006

ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'SUPER_ADMIN';

DO $$ BEGIN
  CREATE TYPE teacher_account_status AS ENUM ('active', 'inactive');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS email TEXT,
  ADD COLUMN IF NOT EXISTS password_hash TEXT,
  ADD COLUMN IF NOT EXISTS phone_number TEXT,
  ADD COLUMN IF NOT EXISTS teacher_account_status teacher_account_status NOT NULL DEFAULT 'active',
  ADD COLUMN IF NOT EXISTS max_quiz_limit INTEGER,
  ADD COLUMN IF NOT EXISTS auth_method TEXT NOT NULL DEFAULT 'whatsapp';

ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_whatsapp_number_unique;
ALTER TABLE profiles ALTER COLUMN whatsapp_number DROP NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS profiles_whatsapp_unique_not_null
  ON profiles (whatsapp_number)
  WHERE whatsapp_number IS NOT NULL AND whatsapp_number <> '';

CREATE UNIQUE INDEX IF NOT EXISTS profiles_email_unique_not_null
  ON profiles (email)
  WHERE email IS NOT NULL AND email <> '';

ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_max_quiz_limit_check;
ALTER TABLE profiles ADD CONSTRAINT profiles_max_quiz_limit_check
  CHECK (max_quiz_limit IS NULL OR max_quiz_limit > 0);

ALTER TABLE quizzes
  ADD COLUMN IF NOT EXISTS is_archived BOOLEAN NOT NULL DEFAULT FALSE;

CREATE INDEX IF NOT EXISTS idx_quizzes_is_archived ON quizzes (is_archived);

CREATE TABLE IF NOT EXISTS subject_catalog (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name_ar     TEXT NOT NULL,
  slug        TEXT NOT NULL UNIQUE,
  sort_order  INTEGER NOT NULL DEFAULT 0,
  is_active   BOOLEAN NOT NULL DEFAULT TRUE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS teacher_subject_assignments (
  teacher_id  UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  subject_id  UUID NOT NULL REFERENCES subject_catalog(id) ON DELETE RESTRICT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (teacher_id, subject_id)
);

CREATE INDEX IF NOT EXISTS idx_teacher_subject_assignments_teacher
  ON teacher_subject_assignments (teacher_id);

CREATE TABLE IF NOT EXISTS admin_audit_log (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id    UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  action      TEXT NOT NULL,
  target_id   UUID,
  metadata    JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_admin_audit_log_admin_id ON admin_audit_log (admin_id);
CREATE INDEX IF NOT EXISTS idx_admin_audit_log_created_at ON admin_audit_log (created_at DESC);

INSERT INTO subject_catalog (name_ar, slug, sort_order) VALUES
  ('رياضيات', 'math', 1),
  ('فيزياء', 'physics', 2),
  ('كيمياء', 'chemistry', 3),
  ('أحياء', 'biology', 4),
  ('لغة عربية', 'arabic', 5),
  ('لغة إنجليزية', 'english', 6),
  ('تاريخ', 'history', 7),
  ('جغرافيا', 'geography', 8)
ON CONFLICT (slug) DO NOTHING;

UPDATE profiles
SET teacher_account_status = 'active'
WHERE role = 'TEACHER' AND teacher_account_status IS NULL;
