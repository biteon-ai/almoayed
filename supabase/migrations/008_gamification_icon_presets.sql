-- المؤيد — Expand gamification icon types for presets (GAMIF-002)
-- Migration 008

ALTER TABLE gamification_tiers
  DROP CONSTRAINT IF EXISTS gamification_tiers_icon_type_check;

ALTER TABLE gamification_tiers
  ADD CONSTRAINT gamification_tiers_icon_type_check
  CHECK (
    icon_type IN (
      'cup',
      'diamond',
      'star',
      'shield',
      'badge',
      'badge_bronze',
      'badge_silver',
      'badge_gold',
      'star_bronze',
      'star_silver',
      'star_gold',
      'cup_bronze',
      'cup_silver',
      'cup_gold',
      'crown'
    )
  );
