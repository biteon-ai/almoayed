import { computeQuizListItem } from "@/lib/quiz-access";
import type {
  Quiz,
  StudentTier,
  TeacherDashboardAnalytics,
} from "@/types/database";

/** Raw payload from `get_teacher_dashboard_analytics` RPC (PERF-002 row dump — legacy fallback input). */
export type TeacherDashboardRpcPayload = {
  studentLinks: Array<{ student_id: string; tier: StudentTier }>;
  quizzes: Quiz[];
  submissions: Array<{
    student_id: string;
    quiz_id: string;
    score: number;
    submitted_at: string;
  }>;
  profiles: Array<{ id: string; full_name: string }>;
  groupMembers: Array<{ student_id: string; group_id: string }>;
  studentCount: number;
  quizCount: number;
  pendingUpgrades: number;
};

/** PERF-004 aggregate KPI payload (no full catalogs). */
export type TeacherDashboardKpiPayload = {
  studentCount?: number;
  quizCount?: number;
  pendingUpgrades?: number;
  submissionCount?: number;
  averageScore?: number;
  passRate?: number;
  perfectScoreStudentCount?: number;
  completionRate?: number;
  gradeDistribution?: Array<{
    range: string;
    label: string;
    count: number;
  }>;
  weeklyActivity?: Array<{
    day: string;
    passed: number;
    failed: number;
  }>;
  popularExams?: Array<{
    rank: number;
    title: string;
    attempts: number;
    completionRate: number;
  }>;
  topPerformer?: {
    studentId: string;
    name: string;
    averageScore: number;
  } | null;
  examDifficulty?: {
    hardest: { title: string; avgScore: number; passRate: number } | null;
    easiest: { title: string; avgScore: number; passRate: number } | null;
  };
};

const GRADE_FILLS: Record<string, string> = {
  "0-49%": "#ef4444",
  "50-64%": "#f59e0b",
  "65-79%": "#10b981",
  "80-89%": "#059669",
  "90-100%": "#047857",
};

function averageScoreLabel(score: number): string {
  if (score >= 90) return "ممتاز";
  if (score >= 80) return "جيد جداً";
  if (score >= 65) return "جيد";
  if (score >= 50) return "مقبول";
  return "يحتاج تحسين";
}

/** Detect aggregate KPI shape vs legacy row-dump RPC payload. */
export function isTeacherDashboardKpiPayload(
  payload: unknown
): payload is TeacherDashboardKpiPayload {
  if (!payload || typeof payload !== "object") return false;
  const p = payload as Record<string, unknown>;
  if (Array.isArray(p.studentLinks) || Array.isArray(p.submissions)) return false;
  return (
    typeof p.studentCount === "number" ||
    Array.isArray(p.gradeDistribution) ||
    Array.isArray(p.popularExams)
  );
}

/** Map PERF-004 KPI JSON → TeacherDashboardAnalytics (first-paint safe defaults). */
export function mapTeacherDashboardKpiPayload(
  payload: TeacherDashboardKpiPayload
): TeacherDashboardAnalytics {
  const studentCount = Number(payload.studentCount) || 0;
  const quizCount = Number(payload.quizCount) || 0;
  const pendingUpgrades = Number(payload.pendingUpgrades) || 0;
  const submissionCount = Number(payload.submissionCount) || 0;
  const averageScore = Number(payload.averageScore) || 0;
  const passRate = Number(payload.passRate) || 0;
  const perfectScoreStudentCount =
    Number(payload.perfectScoreStudentCount) || 0;
  const completionRate = Number(payload.completionRate) || 0;
  const popularExams = (payload.popularExams ?? []).slice(0, 10).map((exam, i) => ({
    rank: exam.rank ?? i + 1,
    title: exam.title ?? "",
    attempts: Number(exam.attempts) || 0,
    completionRate: Number(exam.completionRate) || 0,
  }));

  const gradeDistribution = (payload.gradeDistribution ?? []).map((row) => ({
    range: row.range,
    label: row.label,
    count: Number(row.count) || 0,
    fill: GRADE_FILLS[row.range] ?? "#10b981",
  }));

  const weeklyActivity = (payload.weeklyActivity ?? []).map((row) => ({
    day: row.day,
    passed: Number(row.passed) || 0,
    failed: Number(row.failed) || 0,
  }));

  const totalAttempts = studentCount * quizCount;

  return {
    studentCount,
    quizCount,
    pendingUpgrades,
    kpis: {
      completionRate,
      completedAttempts: submissionCount,
      totalAttempts,
      completionTrendPct: 0,
      passRate,
      perfectScoreStudentPct:
        studentCount > 0
          ? Math.round((perfectScoreStudentCount / studentCount) * 100)
          : 0,
      perfectScoreStudentCount,
      averageScore,
      averageScoreLabel: averageScoreLabel(averageScore),
      topPerformer: payload.topPerformer
        ? {
            studentId: payload.topPerformer.studentId,
            name: payload.topPerformer.name,
            averageScore: payload.topPerformer.averageScore,
          }
        : null,
    },
    gradeDistribution,
    weeklyActivity,
    examDifficulty: {
      hardest: payload.examDifficulty?.hardest ?? null,
      easiest: payload.examDifficulty?.easiest ?? null,
    },
    popularExams,
  };
}

/** Map legacy RPC payload → TeacherDashboardAnalytics via existing pure compute. */
export function mapTeacherDashboardRpcPayload(
  payload: TeacherDashboardRpcPayload
): TeacherDashboardAnalytics {
  const groupIdsByStudent = new Map<string, string[]>();
  for (const member of payload.groupMembers ?? []) {
    const list = groupIdsByStudent.get(member.student_id) ?? [];
    list.push(member.group_id);
    groupIdsByStudent.set(member.student_id, list);
  }

  return computeTeacherDashboardAnalytics({
    studentLinks: payload.studentLinks ?? [],
    quizzes: (payload.quizzes ?? []) as Quiz[],
    submissions: payload.submissions ?? [],
    profiles: payload.profiles ?? [],
    groupIdsByStudent,
    studentCount: Number(payload.studentCount) || 0,
    quizCount: Number(payload.quizCount) || 0,
    pendingUpgrades: Number(payload.pendingUpgrades) || 0,
  });
}

const PASS_THRESHOLD = 60;
const PERFECT_SCORE = 100;

const GRADE_BUCKETS = [
  { min: 0, max: 49, range: "0-49%", label: "راسب", fill: "#ef4444" },
  { min: 50, max: 64, range: "50-64%", label: "مقبول", fill: "#f59e0b" },
  { min: 65, max: 79, range: "65-79%", label: "جيد", fill: "#10b981" },
  { min: 80, max: 89, range: "80-89%", label: "جيد جداً", fill: "#059669" },
  { min: 90, max: 100, range: "90-100%", label: "ممتاز", fill: "#047857" },
] as const;

const WEEKDAY_LABELS = [
  "الأحد",
  "الاثنين",
  "الثلاثاء",
  "الأربعاء",
  "الخميس",
  "الجمعة",
  "السبت",
] as const;

type SubmissionRow = {
  student_id: string;
  quiz_id: string;
  score: number;
  submitted_at: string;
};

type StudentLinkRow = {
  student_id: string;
  tier: StudentTier;
};

type ProfileRow = {
  id: string;
  full_name: string;
};

function startOfWeek(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - day);
  return d;
}

function countAccessibleQuizzes(
  quizzes: Quiz[],
  tier: StudentTier,
  groupIds: string[]
): number {
  return quizzes.filter(
    (quiz) => computeQuizListItem(quiz, { tier, groupIds }).isAccessible
  ).length;
}

function bucketStudentAverage(average: number) {
  return (
    GRADE_BUCKETS.find(
      (bucket) => average >= bucket.min && average <= bucket.max
    ) ?? GRADE_BUCKETS[0]
  );
}

export function computeTeacherDashboardAnalytics(input: {
  studentLinks: StudentLinkRow[];
  quizzes: Quiz[];
  submissions: SubmissionRow[];
  profiles: ProfileRow[];
  groupIdsByStudent: Map<string, string[]>;
  studentCount: number;
  quizCount: number;
  pendingUpgrades: number;
  now?: Date;
}): TeacherDashboardAnalytics {
  const now = input.now ?? new Date();
  const activeQuizzes = input.quizzes.filter((quiz) => quiz.is_active);
  const activeStudentIds = new Set(
    input.studentLinks.map((link) => link.student_id)
  );

  const profileById = new Map(
    input.profiles.map((profile) => [profile.id, profile.full_name])
  );

  const scopedSubmissions = input.submissions.filter(
    (submission) =>
      activeStudentIds.has(submission.student_id) &&
      activeQuizzes.some((quiz) => quiz.id === submission.quiz_id)
  );

  let totalPossibleAttempts = 0;
  for (const link of input.studentLinks) {
    const groupIds = input.groupIdsByStudent.get(link.student_id) ?? [];
    totalPossibleAttempts += countAccessibleQuizzes(
      activeQuizzes,
      link.tier,
      groupIds
    );
  }

  const completedAttempts = scopedSubmissions.length;
  const completionRate =
    totalPossibleAttempts > 0
      ? Math.round((completedAttempts / totalPossibleAttempts) * 1000) / 10
      : 0;

  const thisWeekStart = startOfWeek(now);
  const lastWeekStart = new Date(thisWeekStart);
  lastWeekStart.setDate(lastWeekStart.getDate() - 7);
  const lastWeekEnd = new Date(thisWeekStart);

  const submissionsThisWeek = scopedSubmissions.filter((submission) => {
    const submittedAt = new Date(submission.submitted_at);
    return submittedAt >= thisWeekStart;
  }).length;

  const submissionsLastWeek = scopedSubmissions.filter((submission) => {
    const submittedAt = new Date(submission.submitted_at);
    return submittedAt >= lastWeekStart && submittedAt < lastWeekEnd;
  }).length;

  let completionTrendPct = 0;
  const possibleThisWeek = totalPossibleAttempts;
  const possibleLastWeek = totalPossibleAttempts;
  if (possibleThisWeek > 0) {
    const rateThisWeek = (submissionsThisWeek / possibleThisWeek) * 100;
    const rateLastWeek = (submissionsLastWeek / possibleLastWeek) * 100;
    completionTrendPct = Math.round((rateThisWeek - rateLastWeek) * 10) / 10;
  }

  const passCount = scopedSubmissions.filter(
    (submission) => submission.score >= PASS_THRESHOLD
  ).length;
  const passRate =
    completedAttempts > 0
      ? Math.round((passCount / completedAttempts) * 100)
      : 0;

  const perfectScoreStudentIds = new Set(
    scopedSubmissions
      .filter((submission) => submission.score === PERFECT_SCORE)
      .map((submission) => submission.student_id)
  );
  const perfectScoreStudentCount = perfectScoreStudentIds.size;
  const perfectScoreStudentPct =
    activeStudentIds.size > 0
      ? Math.round((perfectScoreStudentCount / activeStudentIds.size) * 100)
      : 0;

  const averageScore =
    completedAttempts > 0
      ? Math.round(
          scopedSubmissions.reduce((sum, submission) => sum + submission.score, 0) /
            completedAttempts
        )
      : 0;

  const scoresByStudent = new Map<string, number[]>();
  for (const submission of scopedSubmissions) {
    const list = scoresByStudent.get(submission.student_id) ?? [];
    list.push(submission.score);
    scoresByStudent.set(submission.student_id, list);
  }

  let topPerformer: TeacherDashboardAnalytics["kpis"]["topPerformer"] = null;
  for (const [studentId, scores] of Array.from(scoresByStudent.entries())) {
    const studentAverage = Math.round(
      scores.reduce((sum, score) => sum + score, 0) / scores.length
    );
    if (
      !topPerformer ||
      studentAverage > topPerformer.averageScore ||
      (studentAverage === topPerformer.averageScore &&
        scores.length > (scoresByStudent.get(topPerformer.studentId)?.length ?? 0))
    ) {
      topPerformer = {
        studentId,
        name: profileById.get(studentId) ?? "طالب",
        averageScore: studentAverage,
      };
    }
  }

  const gradeDistribution = GRADE_BUCKETS.map((bucket) => ({
    range: bucket.range,
    label: bucket.label,
    count: 0,
    fill: bucket.fill,
  }));

  for (const scores of Array.from(scoresByStudent.values())) {
    const studentAverage = Math.round(
      scores.reduce((sum, score) => sum + score, 0) / scores.length
    );
    const bucket = bucketStudentAverage(studentAverage);
    const row = gradeDistribution.find((item) => item.range === bucket.range);
    if (row) row.count += 1;
  }

  const weeklyActivity = WEEKDAY_LABELS.map((day) => ({
    day,
    passed: 0,
    failed: 0,
  }));

  for (const submission of scopedSubmissions) {
    const submittedAt = new Date(submission.submitted_at);
    if (submittedAt < thisWeekStart) continue;
    const dayIndex = submittedAt.getDay();
    const row = weeklyActivity[dayIndex];
    if (!row) continue;
    if (submission.score >= PASS_THRESHOLD) {
      row.passed += 1;
    } else {
      row.failed += 1;
    }
  }

  const quizStats = activeQuizzes.map((quiz) => {
    const quizSubmissions = scopedSubmissions.filter(
      (submission) => submission.quiz_id === quiz.id
    );
    const attempts = quizSubmissions.length;
    const avgScore =
      attempts > 0
        ? Math.round(
            quizSubmissions.reduce((sum, submission) => sum + submission.score, 0) /
              attempts
          )
        : 0;
    const quizPassRate =
      attempts > 0
        ? Math.round(
            (quizSubmissions.filter((submission) => submission.score >= PASS_THRESHOLD)
              .length /
              attempts) *
              100
          )
        : 0;

    let accessibleStudents = 0;
    for (const link of input.studentLinks) {
      const groupIds = input.groupIdsByStudent.get(link.student_id) ?? [];
      if (
        computeQuizListItem(quiz, { tier: link.tier, groupIds }).isAccessible
      ) {
        accessibleStudents += 1;
      }
    }

    const quizCompletionRate =
      accessibleStudents > 0
        ? Math.round((attempts / accessibleStudents) * 100)
        : 0;

    return {
      quizId: quiz.id,
      title: quiz.title,
      attempts,
      avgScore,
      passRate: quizPassRate,
      completionRate: quizCompletionRate,
    };
  });

  const quizzesWithAttempts = quizStats.filter((quiz) => quiz.attempts > 0);
  const sortedByDifficulty = [...quizzesWithAttempts].sort(
    (a, b) => a.avgScore - b.avgScore
  );
  const sortedByPopularity = [...quizzesWithAttempts].sort(
    (a, b) => b.attempts - a.attempts
  );

  const hardest = sortedByDifficulty[0] ?? null;
  const easiest =
    sortedByDifficulty.length > 0
      ? sortedByDifficulty[sortedByDifficulty.length - 1]
      : null;

  return {
    studentCount: input.studentCount,
    quizCount: input.quizCount,
    pendingUpgrades: input.pendingUpgrades,
    kpis: {
      completionRate,
      completedAttempts,
      totalAttempts: totalPossibleAttempts,
      completionTrendPct: completionTrendPct,
      passRate,
      perfectScoreStudentPct,
      perfectScoreStudentCount,
      averageScore,
      averageScoreLabel: averageScoreLabel(averageScore),
      topPerformer,
    },
    gradeDistribution,
    weeklyActivity,
    examDifficulty: {
      hardest: hardest
        ? {
            title: hardest.title,
            avgScore: hardest.avgScore,
            passRate: hardest.passRate,
          }
        : null,
      easiest: easiest
        ? {
            title: easiest.title,
            avgScore: easiest.avgScore,
            passRate: easiest.passRate,
          }
        : null,
    },
    popularExams: sortedByPopularity.map((quiz, index) => ({
      rank: index + 1,
      title: quiz.title,
      attempts: quiz.attempts,
      completionRate: quiz.completionRate,
    })),
  };
}
