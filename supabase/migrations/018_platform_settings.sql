-- ADMIN-002: global runtime platform flags (Demo Mode + Fixed OTP)

CREATE TABLE IF NOT EXISTS platform_settings (
  key         TEXT PRIMARY KEY,
  value       JSONB NOT NULL,
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_by  UUID REFERENCES profiles(id) ON DELETE SET NULL
);

ALTER TABLE platform_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS platform_settings_deny_all ON platform_settings;
CREATE POLICY platform_settings_deny_all ON platform_settings
  FOR ALL USING (false) WITH CHECK (false);

INSERT INTO platform_settings (key, value)
VALUES
  ('demo_mode_enabled', 'true'::jsonb),
  ('fixed_otp_enabled', 'false'::jsonb),
  ('fixed_otp_code', '"123456"'::jsonb)
ON CONFLICT (key) DO NOTHING;
