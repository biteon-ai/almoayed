-- Quiz ↔ teacher group many-to-many assignments (TEACH-001 extension)

CREATE TABLE IF NOT EXISTS quiz_groups (
  quiz_id UUID NOT NULL REFERENCES quizzes(id) ON DELETE CASCADE,
  group_id UUID NOT NULL REFERENCES teacher_groups(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (quiz_id, group_id)
);

CREATE INDEX IF NOT EXISTS idx_quiz_groups_group_id ON quiz_groups (group_id);

-- Backfill legacy single-group target
INSERT INTO quiz_groups (quiz_id, group_id)
SELECT id, target_group_id
FROM quizzes
WHERE target_group_id IS NOT NULL
ON CONFLICT (quiz_id, group_id) DO NOTHING;
