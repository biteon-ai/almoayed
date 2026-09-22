-- QUIZ-004 harden: absolute ends_at + attempt stamp so refresh/retake cannot reset the clock

ALTER TABLE quiz_timed_sessions
  ADD COLUMN IF NOT EXISTS used_attempts_at_start INTEGER NOT NULL DEFAULT 0;

ALTER TABLE quiz_timed_sessions
  ADD COLUMN IF NOT EXISTS ends_at TIMESTAMPTZ;

-- Backfill absolute expiry from the snapshotted start + duration
UPDATE quiz_timed_sessions
SET ends_at = started_at + (duration_minutes * INTERVAL '1 minute')
WHERE ends_at IS NULL;

ALTER TABLE quiz_timed_sessions
  ALTER COLUMN ends_at SET NOT NULL;

COMMENT ON COLUMN quiz_timed_sessions.ends_at IS
  'QUIZ-004: absolute server expiry (started_at + duration snapshot); source of truth for remaining time';
COMMENT ON COLUMN quiz_timed_sessions.used_attempts_at_start IS
  'QUIZ-004: exam_submissions count when this session was created; stale rows are replaced on a new attempt';
