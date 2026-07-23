import { splitQuizExamSections } from "@/lib/quiz-exam-list";
import type { QuizCarouselItem, RecentScoreRow } from "@/types/database";

export type StudentAchievementIcon = "flame" | "award" | "trophy" | "target";

export interface StudentAchievement {
  id: string;
  title: string;
  description: string;
  icon: StudentAchievementIcon;
  earned: boolean;
}

export interface StudentGamification {
  streakDays: number;
  completedThisWeek: number;
  scoreTrendPercent: number | null;
  dailyGoalProgress: number;
  achievements: StudentAchievement[];
  continueQuiz: QuizCarouselItem | null;
  continueProgress: number;
}

function toDayKey(iso: string): string {
  return iso.slice(0, 10);
}

function previousDayKey(dayKey: string): string {
  const date = new Date(`${dayKey}T12:00:00Z`);
  date.setUTCDate(date.getUTCDate() - 1);
  return date.toISOString().slice(0, 10);
}

/** Consecutive calendar days with at least one submission, ending today or yesterday. */
export function computeStudyStreak(submissionDates: string[]): number {
  if (submissionDates.length === 0) return 0;

  const uniqueDays = new Set(submissionDates.map(toDayKey));
  const today = new Date().toISOString().slice(0, 10);
  const yesterday = previousDayKey(today);

  if (!uniqueDays.has(today) && !uniqueDays.has(yesterday)) return 0;

  let streak = 0;
  let cursor = uniqueDays.has(today) ? today : yesterday;

  while (uniqueDays.has(cursor)) {
    streak += 1;
    cursor = previousDayKey(cursor);
  }

  return streak;
}

export function countSubmissionsInLastDays(
  submissionDates: string[],
  days: number
): number {
  const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;
  return submissionDates.filter(
    (date) => new Date(date).getTime() >= cutoff
  ).length;
}

/** Compare average score in the last 7 days vs the prior 7 days. */
export function computeScoreTrendPercent(
  scores: RecentScoreRow[]
): number | null {
  if (scores.length < 2) return null;

  const now = Date.now();
  const weekMs = 7 * 24 * 60 * 60 * 1000;
  const recentCutoff = now - weekMs;
  const priorCutoff = now - weekMs * 2;

  const recent = scores.filter(
    (row) => new Date(row.submittedAt).getTime() >= recentCutoff
  );
  const prior = scores.filter((row) => {
    const time = new Date(row.submittedAt).getTime();
    return time >= priorCutoff && time < recentCutoff;
  });

  if (recent.length === 0 || prior.length === 0) return null;

  const recentAvg =
    recent.reduce((sum, row) => sum + row.score, 0) / recent.length;
  const priorAvg =
    prior.reduce((sum, row) => sum + row.score, 0) / prior.length;

  return Math.round(recentAvg - priorAvg);
}

export function computeDailyGoalProgress(submissionDates: string[]): number {
  const today = new Date().toISOString().slice(0, 10);
  const completedToday = submissionDates.some(
    (date) => toDayKey(date) === today
  );
  return completedToday ? 100 : 0;
}

export function buildStudentAchievements(input: {
  streakDays: number;
  recentScores: RecentScoreRow[];
  completedQuizCount: number;
}): StudentAchievement[] {
  const highScore = input.recentScores.some((row) => row.score >= 85);

  return [
    {
      id: "study-flame",
      title: "شعلة المذاكرة",
      description: "أكمل 5 أيام متتالية من التدريب",
      icon: "flame",
      earned: input.streakDays >= 5,
    },
    {
      id: "calculus-hero",
      title: "بطل التفاضل",
      description: "حصل على درجة أعلى من 85%",
      icon: "award",
      earned: highScore,
    },
    {
      id: "exam-marathon",
      title: "ماراثون الاختبارات",
      description: "أكمل 10 اختبارات على الأقل",
      icon: "trophy",
      earned: input.completedQuizCount >= 10,
    },
    {
      id: "steady-progress",
      title: "تقدم ثابت",
      description: "حافظ على معدل 70% أو أعلى",
      icon: "target",
      earned:
        input.recentScores.length >= 3 &&
        input.recentScores.reduce((sum, row) => sum + row.score, 0) /
          input.recentScores.length >=
          70,
    },
  ];
}

export function computeStudentGamification(input: {
  quizzes: QuizCarouselItem[];
  recentScores: RecentScoreRow[];
  completedQuizCount: number;
}): StudentGamification {
  const submissionDates = input.recentScores.map((row) => row.submittedAt);
  const streakDays = computeStudyStreak(submissionDates);
  const { continueQuiz } = splitQuizExamSections(input.quizzes);

  const continueProgress = continueQuiz
    ? continueQuiz.hasSubmission
      ? 100
      : 0
    : 0;

  return {
    streakDays,
    completedThisWeek: countSubmissionsInLastDays(submissionDates, 7),
    scoreTrendPercent: computeScoreTrendPercent(input.recentScores),
    dailyGoalProgress: computeDailyGoalProgress(submissionDates),
    achievements: buildStudentAchievements({
      streakDays,
      recentScores: input.recentScores,
      completedQuizCount: input.completedQuizCount,
    }),
    continueQuiz,
    continueProgress,
  };
}
