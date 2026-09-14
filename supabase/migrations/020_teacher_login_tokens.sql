-- AUTH-009: one-time teacher password-reset and magic-link tokens
CREATE TABLE IF NOT EXISTS teacher_login_tokens (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id   UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  purpose      TEXT NOT NULL,
  token_hash   TEXT NOT NULL UNIQUE,
  expires_at   TIMESTAMPTZ NOT NULL,
  consumed_at  TIMESTAMPTZ,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT teacher_login_tokens_purpose_check
    CHECK (purpose IN ('password_reset', 'magic_link')),
  CONSTRAINT teacher_login_tokens_expires_after_created
    CHECK (expires_at > created_at)
);

CREATE INDEX IF NOT EXISTS idx_teacher_login_tokens_profile_created
  ON teacher_login_tokens (profile_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_teacher_login_tokens_unused
  ON teacher_login_tokens (profile_id)
  WHERE consumed_at IS NULL;

ALTER TABLE teacher_login_tokens ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS teacher_login_tokens_deny_all ON teacher_login_tokens;
CREATE POLICY teacher_login_tokens_deny_all ON teacher_login_tokens
  FOR ALL USING (false) WITH CHECK (false);
