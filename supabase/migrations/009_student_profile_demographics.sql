-- PROFILE-002: Student demographic fields + onboarding / profile completion flags
-- Extends profiles; reuses existing email + address columns

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS birth_date date,
  ADD COLUMN IF NOT EXISTS education_stage text,
  ADD COLUMN IF NOT EXISTS province text,
  ADD COLUMN IF NOT EXISTS city text,
  ADD COLUMN IF NOT EXISTS referral_source text,
  ADD COLUMN IF NOT EXISTS primary_subject text,
  ADD COLUMN IF NOT EXISTS onboarding_completed boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS profile_completed boolean NOT NULL DEFAULT false;

COMMENT ON COLUMN profiles.birth_date IS 'Student birth date (PROFILE-002)';
COMMENT ON COLUMN profiles.education_stage IS 'primary|preparatory|secondary|baccalaureate|university|other';
COMMENT ON COLUMN profiles.referral_source IS 'class|whatsapp|friend|social|other';
COMMENT ON COLUMN profiles.onboarding_completed IS 'First 3-step onboarding done';
COMMENT ON COLUMN profiles.profile_completed IS 'Required demographics valid for quiz gate';
