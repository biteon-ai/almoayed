import type {
  GamificationIconType,
  GamificationTierSaveInput,
} from "@/types/database";

/**
 * [GAMIF-002] Default progression ladder for «تحميل الإعدادات الافتراضية».
 * Ordered effort ladder: badges → stars → cups → diamond/crown.
 */
export const DEFAULT_GAMIFICATION_TIERS: ReadonlyArray<{
  level_number: number;
  level_name: string;
  min_completed_quizzes: number;
  min_avg_score: number;
  icon_type: GamificationIconType;
  icon_symbol: string;
}> = [
  {
    level_number: 1,
    level_name: "مبتدئ شغوف",
    min_completed_quizzes: 1,
    min_avg_score: 50,
    icon_type: "badge_bronze",
    icon_symbol: "🥉",
  },
  {
    level_number: 2,
    level_name: "مكافح مجتهد",
    min_completed_quizzes: 3,
    min_avg_score: 60,
    icon_type: "badge_silver",
    icon_symbol: "🥈",
  },
  {
    level_number: 3,
    level_name: "بطل المستويات الأولى",
    min_completed_quizzes: 5,
    min_avg_score: 70,
    icon_type: "badge_gold",
    icon_symbol: "🥇",
  },
  {
    level_number: 4,
    level_name: "نجم صاعد",
    min_completed_quizzes: 8,
    min_avg_score: 75,
    icon_type: "star_bronze",
    icon_symbol: "⭐",
  },
  {
    level_number: 5,
    level_name: "نجم التفوق",
    min_completed_quizzes: 12,
    min_avg_score: 80,
    icon_type: "star_silver",
    icon_symbol: "🌟",
  },
  {
    level_number: 6,
    level_name: "نجم ساطع",
    min_completed_quizzes: 15,
    min_avg_score: 85,
    icon_type: "star_gold",
    icon_symbol: "✨",
  },
  {
    level_number: 7,
    level_name: "صاحب الكأس البرونزي",
    min_completed_quizzes: 20,
    min_avg_score: 88,
    icon_type: "cup_bronze",
    icon_symbol: "🏆",
  },
  {
    level_number: 8,
    level_name: "صاحب الكأس الفضي",
    min_completed_quizzes: 25,
    min_avg_score: 90,
    icon_type: "cup_silver",
    icon_symbol: "🏆",
  },
  {
    level_number: 9,
    level_name: "صاحب الكأس الذهبي",
    min_completed_quizzes: 30,
    min_avg_score: 92,
    icon_type: "cup_gold",
    icon_symbol: "🏆",
  },
  {
    level_number: 10,
    level_name: "فارس الألماس",
    min_completed_quizzes: 40,
    min_avg_score: 95,
    icon_type: "diamond",
    icon_symbol: "💎",
  },
  {
    level_number: 11,
    level_name: "الأسطورة الخالدة",
    min_completed_quizzes: 50,
    min_avg_score: 98,
    icon_type: "crown",
    icon_symbol: "👑",
  },
] as const;

/** Save-ready payload (form / Server Action shape). */
export function getDefaultGamificationTierPayload(): GamificationTierSaveInput[] {
  return DEFAULT_GAMIFICATION_TIERS.map((tier) => ({
    levelName: tier.level_name,
    minCompletedQuizzes: tier.min_completed_quizzes,
    minAvgScore: tier.min_avg_score,
    iconType: tier.icon_type,
  }));
}
