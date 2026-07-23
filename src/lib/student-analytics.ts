import { computeQuizListItem } from "@/lib/quiz-access";
import { aggregateCategoryPerformance } from "@/lib/weak-points";
import type {
  CategoryPerformance,
  Quiz,
  StudentTier,
  TeacherStudentAnalytics,
} from "@/types/database";

const PASS_THRESHOLD = 60;

type SubmissionRow = {
  quiz_id: string;
  score: number;
  submitted_at: string;
};

type AnswerRow = {
  is_correct: boolean;
  category_tag: string;
};

function averageScoreLabel(score: number): string {
  if (score >= 90) return "ممتاز";
  if (score >= 80) return "جيد جداً";
  if (score >= 65) return "جيد";
  if (score >= 50) return "مقبول";
  return "يحتاج تحسين";
}

export function computeTeacherStudentAnalytics(input: {
  tier: StudentTier;
  groupIds: string[];
  quizzes: Quiz[];
  submissions: SubmissionRow[];
  answerStats: AnswerRow[];
}): TeacherStudentAnalytics {
  const activeQuizzes = input.quizzes.filter((quiz) => quiz.is_active);
  const accessibleQuizzes = activeQuizzes.filter(
    (quiz) =>
      computeQuizListItem(quiz, {
        tier: input.tier,
        groupIds: input.groupIds,
      }).isAccessible
  );

  const submissionByQuiz = new Map<string, SubmissionRow>();
  for (const submission of input.submissions) {
    const existing = submissionByQuiz.get(submission.quiz_id);
    if (
      !existing ||
      new Date(submission.submitted_at).getTime() >
        new Date(existing.submitted_at).getTime()
    ) {
      submissionByQuiz.set(submission.quiz_id, submission);
    }
  }

  const latestSubmissions = Array.from(submissionByQuiz.values());
  const completedAttempts = latestSubmissions.length;
  const totalAccessibleQuizzes = accessibleQuizzes.length;
  const completionRate =
    totalAccessibleQuizzes > 0
      ? Math.round((completedAttempts / totalAccessibleQuizzes) * 1000) / 10
      : 0;

  const passCount = latestSubmissions.filter(
    (submission) => submission.score >= PASS_THRESHOLD
  ).length;
  const passRate =
    completedAttempts > 0
      ? Math.round((passCount / completedAttempts) * 100)
      : 0;

  const perfectScores = latestSubmissions.filter(
    (submission) => submission.score === 100
  ).length;

  const averageScore =
    completedAttempts > 0
      ? Math.round(
          latestSubmissions.reduce((sum, submission) => sum + submission.score, 0) /
            completedAttempts
        )
      : 0;

  const quizTitleById = new Map(activeQuizzes.map((quiz) => [quiz.id, quiz.title]));

  const recentSubmissions = [...input.submissions]
    .sort(
      (a, b) =>
        new Date(b.submitted_at).getTime() - new Date(a.submitted_at).getTime()
    )
    .slice(0, 8)
    .map((submission) => ({
      quizId: submission.quiz_id,
      quizTitle: quizTitleById.get(submission.quiz_id) ?? "اختبار",
      score: submission.score,
      submittedAt: submission.submitted_at,
      passed: submission.score >= PASS_THRESHOLD,
    }));

  const scoreHistory = [...input.submissions]
    .sort(
      (a, b) =>
        new Date(a.submitted_at).getTime() - new Date(b.submitted_at).getTime()
    )
    .slice(-12)
    .map((submission) => ({
      date: submission.submitted_at,
      score: submission.score,
      quizTitle: quizTitleById.get(submission.quiz_id) ?? "اختبار",
    }));

  const quizBreakdown = accessibleQuizzes.map((quiz) => {
    const submission = submissionByQuiz.get(quiz.id);
    return {
      quizId: quiz.id,
      title: quiz.title,
      score: submission?.score ?? null,
      submittedAt: submission?.submitted_at ?? null,
      accessible: true,
      passed: submission ? submission.score >= PASS_THRESHOLD : null,
    };
  });

  const weakPoints: CategoryPerformance[] = aggregateCategoryPerformance(
    input.answerStats
  );

  return {
    kpis: {
      completionRate,
      completedAttempts,
      totalAccessibleQuizzes,
      passRate,
      averageScore,
      averageScoreLabel: averageScoreLabel(averageScore),
      perfectScores,
    },
    recentSubmissions,
    scoreHistory,
    quizBreakdown,
    weakPoints,
  };
}
