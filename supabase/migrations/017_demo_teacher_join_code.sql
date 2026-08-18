-- AUTH-008: stable demo teacher join code (003 backfill may have assigned a random code)
UPDATE profiles
SET teacher_code = 'AlMoayed-DEMO'
WHERE id = '11111111-1111-1111-1111-111111111111'
  AND role = 'TEACHER'
  AND teacher_code IS DISTINCT FROM 'AlMoayed-DEMO';
