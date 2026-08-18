-- AUTH-008: persist referring teacher code across BiteonSwitch OTP bounce from /join/[code]
ALTER TABLE auth_otp_states
  ADD COLUMN IF NOT EXISTS join_teacher_code TEXT;

COMMENT ON COLUMN auth_otp_states.join_teacher_code IS
  'AUTH-008: teacher_code to link after OTP when join started from /join/[code]';
