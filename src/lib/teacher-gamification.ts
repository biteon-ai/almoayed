import type {
  GamificationIconType,
  GamificationTier,
  GamificationTierSaveInput,
} from "@/types/database";

export const GAMIFICATION_MAX_TIERS = 20;

export const GAMIFICATION_ICON_OPTIONS: Array<{
  value: GamificationIconType;
  label: string;
  emoji: string;
}> = [
  { value: "badge", label: "وسام", emoji: "🏅" },
  { value: "badge_bronze", label: "وسام برونزي", emoji: "🏅" },
  { value: "badge_silver", label: "وسام فضي", emoji: "🏅" },
  { value: "badge_gold", label: "وسام ذهبي", emoji: "🏅" },
  { value: "star", label: "نجمة", emoji: "⭐" },
  { value: "star_bronze", label: "نجمة برونزية", emoji: "⭐" },
  { value: "star_silver", label: "نجمة فضية", emoji: "🌟" },
  { value: "star_gold", label: "نجمة ذهبية", emoji: "✨" },
  { value: "cup", label: "كأس", emoji: "🏆" },
  { value: "cup_bronze", label: "كأس برونزي", emoji: "🏆" },
  { value: "cup_silver", label: "كأس فضي", emoji: "🏆" },
  { value: "cup_gold", label: "كأس ذهبي", emoji: "🏆" },
  { value: "diamond", label: "ألماس", emoji: "💎" },
  { value: "crown", label: "تاج الأسطورة", emoji: "👑" },
  { value: "shield", label: "درع", emoji: "🛡️" },
];

export function gamificationIconLabel(icon: GamificationIconType): string {
  return (
    GAMIFICATION_ICON_OPTIONS.find((o) => o.value === icon)?.label ?? icon
  );
}

export function gamificationIconEmoji(icon: GamificationIconType): string {
  return (
    GAMIFICATION_ICON_OPTIONS.find((o) => o.value === icon)?.emoji ?? "🏅"
  );
}

/** Split metal-tier icons into main glyph + optional corner badge (GAMIF-003). */
export function resolveGamificationIconParts(icon: GamificationIconType): {
  mainIcon: string;
  subBadgeIcon: string | null;
} {
  switch (icon) {
    case "badge_bronze":
      return { mainIcon: "🏅", subBadgeIcon: "🥉" };
    case "badge_silver":
      return { mainIcon: "🏅", subBadgeIcon: "🥈" };
    case "badge_gold":
      return { mainIcon: "🏅", subBadgeIcon: "🥇" };
    case "star_bronze":
      return { mainIcon: "⭐", subBadgeIcon: "🥉" };
    case "star_silver":
      return { mainIcon: "🌟", subBadgeIcon: "🥈" };
    case "star_gold":
      return { mainIcon: "✨", subBadgeIcon: "🥇" };
    case "cup_bronze":
      return { mainIcon: "🏆", subBadgeIcon: "🥉" };
    case "cup_silver":
      return { mainIcon: "🏆", subBadgeIcon: "🥈" };
    case "cup_gold":
      return { mainIcon: "🏆", subBadgeIcon: "🥇" };
    default:
      return {
        mainIcon: gamificationIconEmoji(icon),
        subBadgeIcon: null,
      };
  }
}

export interface LadderTierInput {
  levelName: string;
  minCompletedQuizzes: number;
  minAvgScore: number;
  iconType: GamificationIconType;
}

export type LadderValidation =
  | { ok: true }
  | { ok: false; error: string };

const ICON_SET = new Set<GamificationIconType>(
  GAMIFICATION_ICON_OPTIONS.map((o) => o.value)
);

export function validateGamificationLadder(
  tiers: LadderTierInput[]
): LadderValidation {
  if (tiers.length > GAMIFICATION_MAX_TIERS) {
    return { ok: false, error: "الحد الأقصى 20 مستوى" };
  }

  for (let i = 0; i < tiers.length; i++) {
    const t = tiers[i];
    const name = t.levelName.trim();
    if (!name) {
      return { ok: false, error: "اسم المستوى مطلوب" };
    }
    if (name.length > 40) {
      return { ok: false, error: "اسم المستوى طويل جداً" };
    }
    if (
      !Number.isFinite(t.minCompletedQuizzes) ||
      t.minCompletedQuizzes < 0 ||
      !Number.isInteger(t.minCompletedQuizzes)
    ) {
      return { ok: false, error: "عدد الاختبارات يجب أن يكون عدداً صحيحاً ≥ 0" };
    }
    if (
      !Number.isFinite(t.minAvgScore) ||
      t.minAvgScore < 0 ||
      t.minAvgScore > 100
    ) {
      return { ok: false, error: "المعدل المطلوب يجب أن يكون بين 0 و 100" };
    }
    if (!ICON_SET.has(t.iconType)) {
      return { ok: false, error: "نوع الأيقونة غير صالح" };
    }

    if (i > 0) {
      const prev = tiers[i - 1];
      if (
        t.minCompletedQuizzes < prev.minCompletedQuizzes ||
        t.minAvgScore < prev.minAvgScore
      ) {
        return {
          ok: false,
          error: "المستويات الأعلى يجب ألا تكون أسهل من المستويات الأدنى",
        };
      }
    }
  }

  return { ok: true };
}

export interface SubmissionScoreRow {
  quizId: string;
  score: number;
}

export interface TeacherGamificationBadge {
  tierId: string;
  levelNumber: number;
  levelName: string;
  iconType: GamificationIconType;
  unlocked: boolean;
}

export interface TeacherGamificationStatus {
  totalQuizzesCompleted: number;
  averageScorePercentage: number;
  currentTier: {
    id: string;
    levelNumber: number;
    levelName: string;
    iconType: GamificationIconType;
  } | null;
  nextTier: {
    id: string;
    levelNumber: number;
    levelName: string;
    iconType: GamificationIconType;
    minCompletedQuizzes: number;
    minAvgScore: number;
  } | null;
  /** 0–1 bottleneck fill toward next tier; 1 when at top */
  progressFill: number;
  remainingQuizzes: number;
  remainingScorePoints: number;
  badges: TeacherGamificationBadge[];
}

function meetsTier(
  total: number,
  avg: number,
  tier: Pick<GamificationTier, "min_completed_quizzes" | "min_avg_score">
): boolean {
  return (
    total >= tier.min_completed_quizzes && avg >= Number(tier.min_avg_score)
  );
}

function dimensionProgress(current: number, minRequired: number): number {
  if (minRequired <= 0) return 1;
  return Math.min(1, Math.max(0, current / minRequired));
}

/** Best score per quiz, then count + mean. */
export function aggregateSubmissionStats(
  submissions: SubmissionScoreRow[]
): { totalQuizzesCompleted: number; averageScorePercentage: number } {
  const bestByQuiz = new Map<string, number>();
  for (const row of submissions) {
    const prev = bestByQuiz.get(row.quizId);
    if (prev === undefined || row.score > prev) {
      bestByQuiz.set(row.quizId, row.score);
    }
  }
  const scores = Array.from(bestByQuiz.values());
  const totalQuizzesCompleted = scores.length;
  const averageScorePercentage =
    totalQuizzesCompleted === 0
      ? 0
      : scores.reduce((a, b) => a + b, 0) / totalQuizzesCompleted;
  return { totalQuizzesCompleted, averageScorePercentage };
}

export function computeTeacherGamificationStatus(input: {
  tiers: GamificationTier[];
  submissions: SubmissionScoreRow[];
}): TeacherGamificationStatus | null {
  const { tiers, submissions } = input;
  if (tiers.length === 0) return null;

  const ordered = [...tiers].sort((a, b) => a.level_number - b.level_number);
  const { totalQuizzesCompleted, averageScorePercentage } =
    aggregateSubmissionStats(submissions);

  let currentTier: TeacherGamificationStatus["currentTier"] = null;
  for (const tier of ordered) {
    if (meetsTier(totalQuizzesCompleted, averageScorePercentage, tier)) {
      currentTier = {
        id: tier.id,
        levelNumber: tier.level_number,
        levelName: tier.level_name,
        iconType: tier.icon_type,
      };
    }
  }

  const nextTierRow =
    ordered.find(
      (tier) => !meetsTier(totalQuizzesCompleted, averageScorePercentage, tier)
    ) ?? null;

  const nextTier = nextTierRow
    ? {
        id: nextTierRow.id,
        levelNumber: nextTierRow.level_number,
        levelName: nextTierRow.level_name,
        iconType: nextTierRow.icon_type,
        minCompletedQuizzes: nextTierRow.min_completed_quizzes,
        minAvgScore: Number(nextTierRow.min_avg_score),
      }
    : null;

  let progressFill = 1;
  let remainingQuizzes = 0;
  let remainingScorePoints = 0;

  if (nextTier) {
    const quizProgress = dimensionProgress(
      totalQuizzesCompleted,
      nextTier.minCompletedQuizzes
    );
    const scoreProgress = dimensionProgress(
      averageScorePercentage,
      nextTier.minAvgScore
    );
    progressFill = Math.min(quizProgress, scoreProgress);
    remainingQuizzes = Math.max(
      0,
      nextTier.minCompletedQuizzes - totalQuizzesCompleted
    );
    remainingScorePoints = Math.max(
      0,
      nextTier.minAvgScore - averageScorePercentage
    );
  }

  const badges: TeacherGamificationBadge[] = ordered.map((tier) => ({
    tierId: tier.id,
    levelNumber: tier.level_number,
    levelName: tier.level_name,
    iconType: tier.icon_type,
    unlocked: meetsTier(
      totalQuizzesCompleted,
      averageScorePercentage,
      tier
    ),
  }));

  return {
    totalQuizzesCompleted,
    averageScorePercentage,
    currentTier,
    nextTier,
    progressFill,
    remainingQuizzes,
    remainingScorePoints,
    badges,
  };
}

export function toLadderInputs(
  tiers: GamificationTierSaveInput[]
): LadderTierInput[] {
  return tiers.map((t) => ({
    levelName: t.levelName,
    minCompletedQuizzes: t.minCompletedQuizzes,
    minAvgScore: t.minAvgScore,
    iconType: t.iconType,
  }));
}
