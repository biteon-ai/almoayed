"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import {
  appError,
  ErrorCode,
  logRequestError,
} from "@/lib/app-errors";
import { requireStudent, getActiveTeacherId } from "@/lib/auth";
import { computeQuizListItem } from "@/lib/quiz-access";
import {
  EXAM_QUESTION_SELECT_FIELDS,
} from "@/lib/quiz-gatekeeper";
import {
  computeDashboardStats,
  filterScoresByTeacherQuizIds,
} from "@/lib/dashboard-stats";
import { aggregateCategoryPerformance } from "@/lib/weak-points";
import { getStudentTeachers } from "@/actions/student";
import type {
  CategoryPerformance,
  ExamQuestion,
  Quiz,
  QuizCarouselItem,
  QuizListItem,
  QuizSubmitResult,
  RecentScoreRow,
  StudentDashboardData,
} from "@/types/database";

async function getStudentContext(session: Awaited<ReturnType<typeof requireStudent>>) {
  const supabase = createAdminClient();
  const teacherId =
    session.currentTeacherId ?? (await getActiveTeacherId(session));

  if (!teacherId) {
    return { teacherId: null, tier: "free" as const, groupIds: [] as string[] };
  }

  const { data: link } = await supabase
    .from("student_teachers")
    .select("tier, status")
    .eq("student_id", session.profileId)
    .eq("teacher_id", teacherId)
    .eq("status", "active")
    .maybeSingle();

  const { data: groups } = await supabase
    .from("teacher_group_members")
    .select("group_id, teacher_groups!inner(teacher_id)")
    .eq("student_id", session.profileId);

  const groupIds =
    groups
      ?.filter(
        (g) =>
          (g.teacher_groups as unknown as { teacher_id: string })?.teacher_id ===
          teacherId
      )
      .map((g) => g.group_id as string) ?? [];

  return {
    teacherId,
    tier: (link?.tier as "free" | "pro") ?? "free",
    groupIds,
  };
}

export async function getQuizForStudent(quizId: string): Promise<{
  quiz: Quiz | null;
  questions: ExamQuestion[];
  existingSubmissionId: string | null;
}> {
  const session = await requireStudent();
  const supabase = createAdminClient();
  const ctx = await getStudentContext(session);

  if (!ctx.teacherId) {
    throw appError(ErrorCode.SUBSCRIPTION_REQUIRED);
  }

  const { data: quiz } = await supabase
    .from("quizzes")
    .select("*")
    .eq("id", quizId)
    .eq("created_by", ctx.teacherId)
    .eq("is_active", true)
    .single<Quiz>();

  if (!quiz) {
    return { quiz: null, questions: [], existingSubmissionId: null };
  }

  if (ctx.tier === "free" && !quiz.is_free) {
    throw appError(ErrorCode.PRO_REQUIRED);
  }

  if (quiz.quiz_type === "session_group" && quiz.target_group_id) {
    if (!ctx.groupIds.includes(quiz.target_group_id)) {
      throw appError(ErrorCode.GROUP_REQUIRED);
    }
  }

  const { data: questions } = await supabase
    .from("questions")
    .select(EXAM_QUESTION_SELECT_FIELDS)
    .eq("quiz_id", quizId)
    .order("sort_order", { ascending: true });

  const { data: existing } = await supabase
    .from("exam_submissions")
    .select("id")
    .eq("student_id", session.profileId)
    .eq("quiz_id", quizId)
    .maybeSingle();

  return {
    quiz,
    questions: (questions ?? []) as ExamQuestion[],
    existingSubmissionId: existing?.id ?? null,
  };
}

export async function getSubmissionResults(
  submissionId: string
): Promise<QuizSubmitResult | null> {
  const session = await requireStudent();
  const supabase = createAdminClient();

  const { data: submission } = await supabase
    .from("exam_submissions")
    .select("*")
    .eq("id", submissionId)
    .eq("student_id", session.profileId)
    .single();

  if (!submission) return null;

  const { data: answers } = await supabase
    .from("student_answers")
    .select(
      `
      question_id,
      student_answer,
      is_correct,
      questions (
        correct_answer,
        explanation_text,
        explanation_media_url,
        category_tag,
        question_text,
        question_image_url
      )
    `
    )
    .eq("submission_id", submissionId);

  if (!answers) return null;

  const mapped = answers.map((a) => {
    const q = a.questions as unknown as {
      correct_answer: string;
      explanation_text: string;
      explanation_media_url: string | null;
      category_tag: string;
      question_text: string;
      question_image_url: string | null;
    };
    return {
      questionId: a.question_id,
      studentAnswer: a.student_answer,
      isCorrect: a.is_correct,
      correctAnswer: q.correct_answer,
      explanationText: q.explanation_text,
      explanationMediaUrl: q.explanation_media_url,
      categoryTag: q.category_tag,
      questionText: q.question_text,
      questionImageUrl: q.question_image_url,
    };
  });

  const correctCount = mapped.filter((a) => a.isCorrect).length;

  return {
    submissionId: submission.id,
    score: submission.score,
    totalQuestions: mapped.length,
    correctCount,
    answers: mapped,
  };
}

export async function submitQuiz(
  quizId: string,
  answers: Record<string, string>
): Promise<QuizSubmitResult> {
  const session = await requireStudent();
  await getQuizForStudent(quizId);

  const supabase = createAdminClient();

  const { data: existing } = await supabase
    .from("exam_submissions")
    .select("id")
    .eq("student_id", session.profileId)
    .eq("quiz_id", quizId)
    .maybeSingle();

  if (existing) {
    const results = await getSubmissionResults(existing.id);
    if (results) return results;
  }

  const { data: questions, error: qError } = await supabase
    .from("questions")
    .select(
      "id, correct_answer, explanation_text, explanation_media_url, category_tag, question_text, question_image_url"
    )
    .eq("quiz_id", quizId)
    .order("sort_order", { ascending: true });

  if (qError) {
    logRequestError("QUIZ_QUESTIONS_FETCH_FAILED", qError);
    throw appError(ErrorCode.QUIZ_QUESTIONS_FETCH_FAILED);
  }

  if (!questions?.length) {
    throw appError(ErrorCode.QUIZ_EMPTY);
  }

  const graded = questions.map((q) => {
    const studentAnswer = answers[q.id] ?? "";
    const isCorrect = studentAnswer === q.correct_answer;
    return { ...q, studentAnswer, isCorrect };
  });

  const correctCount = graded.filter((g) => g.isCorrect).length;
  const score = Math.round((correctCount / graded.length) * 100);

  const { data: submission, error: subError } = await supabase
    .from("exam_submissions")
    .insert({
      student_id: session.profileId,
      quiz_id: quizId,
      score,
    })
    .select()
    .single();

  if (subError || !submission) {
    logRequestError("QUIZ_SUBMIT_SAVE_FAILED", subError);
    throw appError(ErrorCode.QUIZ_SUBMIT_SAVE_FAILED);
  }

  const answerRows = graded.map((g) => ({
    submission_id: submission.id,
    question_id: g.id,
    student_answer: g.studentAnswer,
    is_correct: g.isCorrect,
  }));

  const { error: ansError } = await supabase
    .from("student_answers")
    .insert(answerRows);

  if (ansError) {
    logRequestError("QUIZ_ANSWERS_SAVE_FAILED", ansError);
    throw appError(ErrorCode.QUIZ_ANSWERS_SAVE_FAILED);
  }

  return {
    submissionId: submission.id,
    score,
    totalQuestions: graded.length,
    correctCount,
    answers: graded.map((g) => ({
      questionId: g.id,
      studentAnswer: g.studentAnswer,
      isCorrect: g.isCorrect,
      correctAnswer: g.correct_answer,
      explanationText: g.explanation_text,
      explanationMediaUrl: g.explanation_media_url,
      categoryTag: g.category_tag,
      questionText: g.question_text,
      questionImageUrl: g.question_image_url,
    })),
  };
}

export async function getWeakPoints(): Promise<CategoryPerformance[]> {
  const session = await requireStudent();
  const supabase = createAdminClient();

  const { data: answers } = await supabase
    .from("student_answers")
    .select(
      `
      is_correct,
      questions (category_tag),
      exam_submissions!inner (student_id)
    `
    )
    .eq("exam_submissions.student_id", session.profileId);

  if (!answers?.length) return [];

  const rows = answers.map((row) => ({
    is_correct: row.is_correct as boolean,
    category_tag:
      (row.questions as unknown as { category_tag: string })?.category_tag ??
      "عام",
  }));

  return aggregateCategoryPerformance(rows);
}

export async function getStudentDashboardData(): Promise<StudentDashboardData> {
  const session = await requireStudent();
  const ctx = await getStudentContext(session);

  const [weakPoints, teachers] = await Promise.all([
    getWeakPoints(),
    getStudentTeachers(),
  ]);

  const emptyReturn = (): StudentDashboardData => ({
    stats: {
      tier: ctx.tier,
      completedQuizCount: 0,
      overallAverageScore: 0,
    },
    recentScores: [],
    quizzes: [],
    weakPoints,
    teachers,
  });

  if (!ctx.teacherId) {
    return emptyReturn();
  }

  const supabase = createAdminClient();

  const { data: quizRows } = await supabase
    .from("quizzes")
    .select("*")
    .eq("created_by", ctx.teacherId)
    .eq("is_active", true)
    .order("created_at", { ascending: false });

  if (!quizRows?.length) {
    return emptyReturn();
  }

  const quizIds = (quizRows as Quiz[]).map((q) => q.id);

  const [{ data: questionRows }, { data: submissionRows }] = await Promise.all([
    supabase.from("questions").select("quiz_id").in("quiz_id", quizIds),
    supabase
      .from("exam_submissions")
      .select("score, submitted_at, quiz_id")
      .eq("student_id", session.profileId)
      .in("quiz_id", quizIds)
      .order("submitted_at", { ascending: false }),
  ]);

  const questionCountByQuiz = new Map<string, number>();
  for (const row of questionRows ?? []) {
    const id = row.quiz_id as string;
    questionCountByQuiz.set(id, (questionCountByQuiz.get(id) ?? 0) + 1);
  }

  const quizzesWithQuestions = new Set(questionCountByQuiz.keys());
  const submissionByQuiz = new Map(
    (submissionRows ?? []).map((row) => [row.quiz_id as string, row])
  );

  const quizzes: QuizCarouselItem[] = (quizRows as Quiz[])
    .filter((quiz) => quizzesWithQuestions.has(quiz.id))
    .map((quiz) => {
      const listItem = computeQuizListItem(quiz, {
        tier: ctx.tier,
        groupIds: ctx.groupIds,
      });
      return {
        ...listItem,
        questionCount: questionCountByQuiz.get(quiz.id) ?? 0,
        hasSubmission: submissionByQuiz.has(quiz.id),
        lastActivityAt:
          (submissionByQuiz.get(quiz.id)?.submitted_at as string | undefined) ??
          null,
      };
    });

  const teacherQuizIds = new Set(quizzes.map((q) => q.id));
  const teacherScores = filterScoresByTeacherQuizIds(
    (submissionRows ?? []).map((row) => ({
      quiz_id: row.quiz_id as string,
      score: row.score as number,
    })),
    teacherQuizIds
  );
  const { completedQuizCount, overallAverageScore } =
    computeDashboardStats(teacherScores);

  const quizTitleById = new Map(quizzes.map((q) => [q.id, q.title]));

  const recentScores: RecentScoreRow[] = (submissionRows ?? [])
    .filter((row) => teacherQuizIds.has(row.quiz_id as string))
    .slice(0, 5)
    .map((row) => ({
      quizId: row.quiz_id as string,
      quizTitle: quizTitleById.get(row.quiz_id as string) ?? "اختبار",
      score: row.score as number,
      submittedAt: row.submitted_at as string,
    }));

  return {
    stats: {
      tier: ctx.tier,
      completedQuizCount,
      overallAverageScore,
    },
    recentScores,
    quizzes,
    weakPoints,
    teachers,
  };
}

export async function getAvailableQuizzes(): Promise<QuizListItem[]> {
  const session = await requireStudent();
  const supabase = createAdminClient();
  const ctx = await getStudentContext(session);

  if (!ctx.teacherId) return [];

  const { data } = await supabase
    .from("quizzes")
    .select("*")
    .eq("created_by", ctx.teacherId)
    .eq("is_active", true)
    .order("created_at", { ascending: false });

  if (!data?.length) return [];

  const quizIds = data.map((q) => q.id);
  const { data: questionRows } = await supabase
    .from("questions")
    .select("quiz_id")
    .in("quiz_id", quizIds);

  const quizzesWithQuestions = new Set(
    questionRows?.map((row) => row.quiz_id as string) ?? []
  );

  return (data as Quiz[])
    .filter((quiz) => quizzesWithQuestions.has(quiz.id))
    .map((quiz) =>
      computeQuizListItem(quiz, {
        tier: ctx.tier,
        groupIds: ctx.groupIds,
      })
    );
}

export async function getStudentProfile() {
  const session = await requireStudent();
  const supabase = createAdminClient();

  const { data } = await supabase
    .from("profiles")
    .select("full_name, whatsapp_number, is_subscribed")
    .eq("id", session.profileId)
    .single();

  return data;
}
