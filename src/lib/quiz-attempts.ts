import type { AssessmentCategory, QuizAttemptState } from "@/types/database";

export const ASSESSMENT_CATEGORY_LABELS: Record<
  AssessmentCategory,
  string
> = {
  practice: "تدريب / واجب",
  evaluation: "اختبار تقييمي / نصفي",
  challenge: "تحدي / مسابقة",
};

const VALID_CATEGORIES = new Set<AssessmentCategory>([
  "practice",
  "evaluation",
  "challenge",
]);

export function parseAssessmentCategory(
  raw: unknown
): AssessmentCategory | null {
  const value = String(raw ?? "").trim();
  if (VALID_CATEGORIES.has(value as AssessmentCategory)) {
    return value as AssessmentCategory;
  }
  return null;
}

export function categoryDefaultMaxAttempts(
  category: AssessmentCategory
): number {
  switch (category) {
    case "practice":
      return 0;
    case "evaluation":
    case "challenge":
      return 1;
  }
}

export function validateMaxAttempts(input: {
  unlimited: boolean;
  value: unknown;
}):
  | { ok: true; value: number }
  | { ok: false; error: string } {
  if (input.unlimited) {
    return { ok: true, value: 0 };
  }

  const parsed =
    typeof input.value === "number"
      ? input.value
      : Number.parseInt(String(input.value ?? "").trim(), 10);

  if (!Number.isFinite(parsed) || !Number.isInteger(parsed)) {
    return { ok: false, error: "أدخل عدد محاولات صحيحاً (من 1 إلى 10)." };
  }

  if (parsed < 1 || parsed > 10) {
    return { ok: false, error: "عدد المحاولات يجب أن يكون بين 1 و 10." };
  }

  return { ok: true, value: parsed };
}

export function canStartNewAttempt(used: number, max: number): boolean {
  if (max === 0) return true;
  return used < max;
}

export function formatAttemptProgressAr(used: number, max: number): string {
  if (max === 0) return "محاولات غير محدودة";
  if (used >= max) return "انتهت المحاولات";
  const nextAttempt = used + 1;
  return `محاولة ${nextAttempt} من ${max}`;
}

export interface SubmissionRowLite {
  id: string;
  score: number;
  submitted_at: string;
}

export interface QuizSubmissionSummary {
  usedAttempts: number;
  bestScore: number | null;
  latestSubmissionId: string | null;
  latestSubmittedAt: string | null;
}

export function summarizeSubmissions(
  rows: SubmissionRowLite[]
): QuizSubmissionSummary {
  if (rows.length === 0) {
    return {
      usedAttempts: 0,
      bestScore: null,
      latestSubmissionId: null,
      latestSubmittedAt: null,
    };
  }

  let bestScore = rows[0]!.score;
  for (const row of rows) {
    if (row.score > bestScore) bestScore = row.score;
  }

  const latest = [...rows].sort((a, b) =>
    b.submitted_at.localeCompare(a.submitted_at)
  )[0]!;

  return {
    usedAttempts: rows.length,
    bestScore,
    latestSubmissionId: latest.id,
    latestSubmittedAt: latest.submitted_at,
  };
}

export function buildAttemptState(
  maxAttempts: number,
  submissions: SubmissionRowLite[]
): QuizAttemptState {
  const summary = summarizeSubmissions(submissions);
  const canStart = canStartNewAttempt(summary.usedAttempts, maxAttempts);

  return {
    usedAttempts: summary.usedAttempts,
    maxAttempts,
    canStartNewAttempt: canStart,
    bestScore: summary.bestScore,
    latestSubmissionId: summary.latestSubmissionId,
    reviewSubmissionId: canStart ? null : summary.latestSubmissionId,
  };
}

export interface ChallengeLeaderboardInputRow {
  studentId: string;
  displayName: string;
  score: number;
  submittedAt: string;
}

export interface ChallengeLeaderboardRankedRow
  extends ChallengeLeaderboardInputRow {
  rank: number;
}

/** Best score per student; rank DESC score, ASC submit time. */
export function rankChallengeLeaderboard(
  rows: ChallengeLeaderboardInputRow[]
): ChallengeLeaderboardRankedRow[] {
  const bestByStudent = new Map<string, ChallengeLeaderboardInputRow>();

  for (const row of rows) {
    const prev = bestByStudent.get(row.studentId);
    if (!prev) {
      bestByStudent.set(row.studentId, row);
      continue;
    }
    if (
      row.score > prev.score ||
      (row.score === prev.score && row.submittedAt < prev.submittedAt)
    ) {
      bestByStudent.set(row.studentId, row);
    }
  }

  const ranked = Array.from(bestByStudent.values()).sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    return a.submittedAt.localeCompare(b.submittedAt);
  });

  return ranked.map((row, index) => ({ ...row, rank: index + 1 }));
}

export function parseAttemptFormFields(formData: FormData): {
  assessment_category: AssessmentCategory;
  max_attempts: number;
} {
  const category =
    parseAssessmentCategory(formData.get("assessment_category")) ?? "practice";
  const unlimited = formData.get("max_attempts_unlimited") === "on";
  const customized = formData.get("max_attempts_customized") === "on";

  let maxAttempts: number;
  if (customized) {
    const validated = validateMaxAttempts({
      unlimited,
      value: formData.get("max_attempts"),
    });
    if (!validated.ok) {
      throw new Error(validated.error);
    }
    maxAttempts = validated.value;
  } else {
    maxAttempts = categoryDefaultMaxAttempts(category);
  }

  return { assessment_category: category, max_attempts: maxAttempts };
}
