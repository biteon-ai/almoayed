-- المؤيد — Teacher-driven gamification tiers (GAMIF-001)
-- Migration 007

CREATE TABLE IF NOT EXISTS gamification_tiers (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id              UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  level_number            INTEGER NOT NULL CHECK (level_number >= 1),
  level_name              TEXT NOT NULL,
  min_completed_quizzes   INTEGER NOT NULL DEFAULT 0 CHECK (min_completed_quizzes >= 0),
  min_avg_score           NUMERIC(5, 2) NOT NULL DEFAULT 0
                            CHECK (min_avg_score >= 0 AND min_avg_score <= 100),
  icon_type               TEXT NOT NULL
                            CHECK (icon_type IN ('cup', 'diamond', 'star', 'shield', 'badge')),
  created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT gamification_tiers_teacher_level_unique UNIQUE (teacher_id, level_number),
  CONSTRAINT gamification_tiers_level_name_nonempty CHECK (length(trim(level_name)) > 0)
);

CREATE INDEX IF NOT EXISTS idx_gamification_tiers_teacher_id
  ON gamification_tiers (teacher_id);

ALTER TABLE gamification_tiers ENABLE ROW LEVEL SECURITY;

-- App uses service-role admin client; deny-by-default for anon/authenticated.
CREATE POLICY "gamification_tiers_deny_all"
  ON gamification_tiers
  FOR ALL
  USING (false)
  WITH CHECK (false);
