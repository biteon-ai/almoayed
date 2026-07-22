-- AUTH-001: one-time OTP start/callback state (replay protection)
CREATE TABLE IF NOT EXISTS auth_otp_states (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  whatsapp_hint TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  consumed_at   TIMESTAMPTZ,
  provider_ref  TEXT
);

CREATE INDEX IF NOT EXISTS idx_auth_otp_states_created_at
  ON auth_otp_states (created_at);

ALTER TABLE auth_otp_states ENABLE ROW LEVEL SECURITY;
