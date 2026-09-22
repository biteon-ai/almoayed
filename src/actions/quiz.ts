"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import {
  appError,
  ErrorCode,
  logRequestError,
} from "@/lib/app-errors";
import { requireStudent, getActiveTeacherId } from "@/lib/auth";
import { computeQuizListItem, filterQuizzesVisibleToStudent, indexQuizGroupAssignments, isQuizGroupAccessible } from "@/lib/quiz-access";
import {
  EXAM_QUESTION_SELECT_FIELDS,
} from "@/lib/quiz-gatekeeper";
import {
  estimateQuizDurationMinutes,
  STUDENT_EXAMS_PAGE_SIZE,
} from "@/lib/student-quiz-ui";
import {
  clampPage,
  rangeFromPage,
  toPagedResult,
  STUDENT_HOME_QUIZ_WINDOW,
  type PageInput,
  type PagedResult,
} from "@/lib/pagination-server";
import { pickContinueQuiz } from "@/lib/quiz-exam-list";
import { aggregateCategoryPerformance } from "@/lib/weak-points";
import {
  QUIZ_LIST_SELECT,
  SUBMISSION_RESULT_SELECT,
} from "@/lib/perf-selects";
import {
  computeRemainingSeconds,
  padAnswersForQuestions,
  toTimedQuizSessionView,
  type TimedQuizSessionView,
  validateDurationMinutes,
} from "@/lib/quiz-timer";
import { getStudentTeachers } from "@/actions/student";
import {
  buildAttemptState,
  canStartNewAttempt,
  rankChallengeLeaderboard,
  type SubmissionRowLite,
} from "@/lib/quiz-attempts";
import { aggregateSubmissionStats } from "@/lib/teacher-gamification";
import { resolveCorrectOptionText } from "@/lib/question-options";
import {
  applyPresentation,
  authoredPresentation,
  deleteLivePresentation,
  loadLivePresentation,
  parseOptionOrders,
  parseQuestionIds,
  presentationMatchesBank,
  upsertLivePresentation,
  isPermutation,
} from "@/lib/quiz-presentation";
import {
  buildAttemptPresentation,
  createCryptoRng,
} from "@/lib/quiz-shuffle";
import type {
  AttemptPresentation,
  CategoryPerformance,
  ExamQuestion,
  Quiz,
  QuizAttemptState,
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

export async function ensureTimedQuizSession(
  quizId: string
): Promise<TimedQuizSessionView | null> {
  const session = await requireStudent();
  const supabase = createAdminClient();
  const ctx = await getStudentContext(session);

  if (!ctx.teacherId) {
    throw appError(ErrorCode.SUBSCRIPTION_REQUIRED);
  }

  const { data: quiz } = await supabase
    .from("quizzes")
    .select(QUIZ_LIST_SELECT)
    .eq("id", quizId)
    .eq("created_by", ctx.teacherId)
    .eq("is_active", true)
    .maybeSingle<Quiz>();

  if (!quiz) return null;

  if (ctx.tier === "free" && !quiz.is_free) {
    throw appError(ErrorCode.PRO_REQUIRED);
  }

  const { data: assignmentRows } = await supabase
    .from("quiz_groups")
    .select("group_id")
    .eq("quiz_id", quizId);

  const assignedGroupIds = (assignmentRows ?? []).map(
    (row) => row.group_id as string
  );

  if (!isQuizGroupAccessible(quiz, ctx.groupIds, assignedGroupIds)) {
    throw appError(ErrorCode.GROUP_REQUIRED);
  }

  const { count: usedAttempts } = await supabase
    .from("exam_submissions")
    .select("id", { count: "exact", head: true })
    .eq("student_id", session.profileId)
    .eq("quiz_id", quizId);

  const used = usedAttempts ?? 0;
  if (!canStartNewAttempt(used, quiz.max_attempts ?? 1)) {
    return null;
  }

  const { data: existingSession } = await supabase
    .from("quiz_timed_sessions")
    .select("started_at, duration_minutes")
    .eq("student_id", session.profileId)
    .eq("quiz_id", quizId)
    .maybeSingle();

  if (used > 0) {
    await supabase
      .from("quiz_timed_sessions")
      .delete()
      .eq("student_id", session.profileId)
      .eq("quiz_id", quizId);
  } else if (existingSession) {
    return toTimedQuizSessionView(
      existingSession.started_at as string,
      existingSession.duration_minutes as number
    );
  }

  if (!quiz.is_timed) return null;

  const validated = validateDurationMinutes(quiz.duration_minutes);
  if (!validated.ok) return null;

  const { data: inserted, error: insertError } = await supabase
    .from("quiz_timed_sessions")
    .insert({
      student_id: session.profileId,
      quiz_id: quizId,
      duration_minutes: validated.value,
    })
    .select("started_at, duration_minutes")
    .single();

  if (insertError) {
    const { data: raced } = await supabase
      .from("quiz_timed_sessions")
      .select("started_at, duration_minutes")
      .eq("student_id", session.profileId)
      .eq("quiz_id", quizId)
      .maybeSingle();

    if (raced) {
      return toTimedQuizSessionView(
        raced.started_at as string,
        raced.duration_minutes as number
      );
    }

    logRequestError("QUIZ_TIMED_SESSION_CREATE_FAILED", insertError);
    return null;
  }

  if (!inserted) return null;

  return toTimedQuizSessionView(
    inserted.started_at as string,
    inserted.duration_minutes as number
  );
}

function snapshotFromSubmissionRow(row: {
  question_order?: unknown;
  option_orders?: unknown;
}): AttemptPresentation | null {
  const questionIds = parseQuestionIds(row.question_order);
  if (questionIds.length === 0) return null;
  return {
    questionIds,
    optionOrders: parseOptionOrders(row.option_orders),
  };
}

async function presentQuestionsForTaking(args: {
  supabase: ReturnType<typeof createAdminClient>;
  studentId: string;
  quizId: string;
  questions: ExamQuestion[];
  previous: AttemptPresentation | null;
}): Promise<ExamQuestion[]> {
  const { supabase, studentId, quizId, questions, previous } = args;
  if (questions.length === 0) return questions;

  const live = await loadLivePresentation(supabase, studentId, quizId);
  if (live && presentationMatchesBank(live, questions)) {
    return applyPresentation(questions, live);
  }
  if (live) {
    await deleteLivePresentation(supabase, studentId, quizId);
  }

  const minted = buildAttemptPresentation({
    questions,
    previous,
    rng: createCryptoRng(),
  });
  await upsertLivePresentation(supabase, studentId, quizId, minted);
  return applyPresentation(questions, minted);
}

export async function getQuizForStudent(
  quizId: string,
  opts?: { skipPresentation?: boolean }
): Promise<{
  quiz: Quiz | null;
  questions: ExamQuestion[];
  existingSubmissionId: string | null;
  attemptState: QuizAttemptState;
  timer: TimedQuizSessionView | null;
}> {
  const session = await requireStudent();
  const supabase = createAdminClient();
  const ctx = await getStudentContext(session);

  if (!ctx.teacherId) {
    throw appError(ErrorCode.SUBSCRIPTION_REQUIRED);
  }

  const { data: quiz } = await supabase
    .from("quizzes")
    .select(QUIZ_LIST_SELECT)
    .eq("id", quizId)
    .eq("created_by", ctx.teacherId)
    .eq("is_active", true)
    .single<Quiz>();

  // Soft-deleted quizzes remain loadable for mid-exam finish (TEACH-011);
  // student catalogs filter deleted_at separately.

  if (!quiz) {
    return {
      quiz: null,
      questions: [],
      existingSubmissionId: null,
      attemptState: buildAttemptState(1, []),
      timer: null,
    };
  }

  if (ctx.tier === "free" && !quiz.is_free) {
    throw appError(ErrorCode.PRO_REQUIRED);
  }

  const { data: assignmentRows } = await supabase
    .from("quiz_groups")
    .select("group_id")
    .eq("quiz_id", quizId);

  const assignedGroupIds = (assignmentRows ?? []).map(
    (row) => row.group_id as string
  );

  if (!isQuizGroupAccessible(quiz, ctx.groupIds, assignedGroupIds)) {
    throw appError(ErrorCode.GROUP_REQUIRED);
  }

  const { data: questions } = await supabase
    .from("questions")
    .select(EXAM_QUESTION_SELECT_FIELDS)
    .eq("quiz_id", quizId)
    .order("sort_order", { ascending: true });

  const { data: submissionRows } = await supabase
    .from("exam_submissions")
    .select("id, score, submitted_at, question_order, option_orders")
    .eq("student_id", session.profileId)
    .eq("quiz_id", quizId)
    .order("submitted_at", { ascending: false });

  const submissions: SubmissionRowLite[] = (submissionRows ?? []).map((row) => ({
    id: row.id as string,
    score: row.score as number,
    submitted_at: row.submitted_at as string,
  }));

  const attemptState = buildAttemptState(
    quiz.max_attempts ?? 1,
    submissions
  );

  const authoredQuestions = (questions ?? []) as ExamQuestion[];
  const previousSnapshot = snapshotFromSubmissionRow(
    (submissionRows?.[0] as {
      question_order?: unknown;
      option_orders?: unknown;
    }) ?? {}
  );

  const taking =
    attemptState.canStartNewAttempt && !opts?.skipPresentation;

  const presentedQuestions =
    taking && authoredQuestions.length > 0
      ? await presentQuestionsForTaking({
          supabase,
          studentId: session.profileId,
          quizId,
          questions: authoredQuestions,
          previous: previousSnapshot,
        })
      : authoredQuestions;

  const timer =
    attemptState.canStartNewAttempt && quiz.is_timed
      ? await ensureTimedQuizSession(quizId)
      : null;

  return {
    quiz,
    questions: presentedQuestions,
    existingSubmissionId: attemptState.reviewSubmissionId,
    attemptState,
    timer,
  };
}

export async function getSubmissionResults(
  submissionId: string
): Promise<QuizSubmitResult | null> {
  const session = await requireStudent();
  const supabase = createAdminClient();

  const { data: submission } = await supabase
    .from("exam_submissions")
    .select(SUBMISSION_RESULT_SELECT)
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
        options,
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

  const snapshot = snapshotFromSubmissionRow(submission);
  const mapped = answers.map((a) => {
    const q = a.questions as unknown as {
      correct_answer: string;
      options: string[] | null;
      explanation_text: string;
      explanation_media_url: string | null;
      category_tag: string;
      question_text: string;
      question_image_url: string | null;
    };
    const authoredOptions = Array.isArray(q.options) ? q.options : [];
    const snapshotOptions = snapshot?.optionOrders[a.question_id as string];
    const presentedOptions =
      snapshotOptions && isPermutation(snapshotOptions, authoredOptions)
        ? snapshotOptions
        : authoredOptions;
    const correctAnswer = resolveCorrectOptionText(
      q.correct_answer,
      authoredOptions
    );
    return {
      questionId: a.question_id as string,
      studentAnswer: a.student_answer as string,
      isCorrect: a.student_answer === correctAnswer,
      correctAnswer,
      explanationText: q.explanation_text,
      explanationMediaUrl: q.explanation_media_url,
      categoryTag: q.category_tag,
      questionText: q.question_text,
      questionImageUrl: q.question_image_url,
      options: presentedOptions,
    };
  });

  const byId = new Map(mapped.map((row) => [row.questionId, row]));
  const ordered = snapshot
    ? [
        ...snapshot.questionIds
          .map((id) => byId.get(id))
          .filter((row): row is (typeof mapped)[number] => Boolean(row)),
        ...mapped.filter((row) => !snapshot.questionIds.includes(row.questionId)),
      ]
    : mapped;

  const correctCount = ordered.filter((a) => a.isCorrect).length;

  return {
    submissionId: submission.id,
    score: submission.score,
    totalQuestions: ordered.length,
    correctCount,
    answers: ordered,
  };
}

export async function submitQuiz(
  quizId: string,
  answers: Record<string, string>
): Promise<QuizSubmitResult> {
  const session = await requireStudent();
  const gate = await getQuizForStudent(quizId, { skipPresentation: true });

  if (!gate.quiz) {
    throw appError(ErrorCode.QUIZ_INACTIVE);
  }

  const supabase = createAdminClient();

  const { count: usedAttempts } = await supabase
    .from("exam_submissions")
    .select("id", { count: "exact", head: true })
    .eq("student_id", session.profileId)
    .eq("quiz_id", quizId);

  const maxAttempts = gate.quiz.max_attempts ?? 1;
  const used = usedAttempts ?? 0;
  if (!canStartNewAttempt(used, maxAttempts)) {
    throw appError(ErrorCode.QUIZ_ATTEMPTS_EXHAUSTED);
  }

  const { data: liveQuestions, error: liveError } = await supabase
    .from("questions")
    .select("id")
    .eq("quiz_id", quizId)
    .order("sort_order", { ascending: true });

  if (liveError) {
    logRequestError("QUIZ_QUESTIONS_FETCH_FAILED", liveError);
    throw appError(ErrorCode.QUIZ_QUESTIONS_FETCH_FAILED);
  }

  if (!liveQuestions?.length) {
    throw appError(ErrorCode.QUIZ_EMPTY);
  }

  const { data: timedSession } = await supabase
    .from("quiz_timed_sessions")
    .select("started_at, duration_minutes")
    .eq("student_id", session.profileId)
    .eq("quiz_id", quizId)
    .maybeSingle();

  // Deadline from DB session only — never reject submit solely for being past deadline.
  const pastDeadline = timedSession
    ? computeRemainingSeconds(
        timedSession.started_at as string,
        timedSession.duration_minutes as number
      ) <= 0
    : false;

  const liveQuestionIds = liveQuestions.map((q) => q.id as string);
  const liveQuestionIdSet = new Set(liveQuestionIds);
  const answerQuestionIds = Object.keys(answers);

  if (answerQuestionIds.some((id) => !liveQuestionIdSet.has(id))) {
    throw appError(ErrorCode.QUIZ_CHANGED);
  }

  const effectiveAnswers = pastDeadline
    ? padAnswersForQuestions(liveQuestionIds, answers)
    : answers;

  if (
    Object.keys(effectiveAnswers).length !== liveQuestions.length ||
    liveQuestionIds.some((id) => effectiveAnswers[id] === undefined)
  ) {
    throw appError(ErrorCode.QUIZ_CHANGED);
  }

  const { data: questions, error: qError } = await supabase
    .from("questions")
    .select(
      "id, correct_answer, options, explanation_text, explanation_media_url, category_tag, question_text, question_image_url"
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
    const studentAnswer = effectiveAnswers[q.id] ?? "";
    const options = Array.isArray(q.options) ? (q.options as string[]) : [];
    const correctAnswerText = resolveCorrectOptionText(
      q.correct_answer as string,
      options
    );
    const isCorrect = studentAnswer === correctAnswerText;
    return {
      ...q,
      options,
      correct_answer: correctAnswerText,
      studentAnswer,
      isCorrect,
    };
  });

  const shufflable = graded.map((g) => ({
    id: g.id as string,
    options: g.options,
  }));
  const livePresentation = await loadLivePresentation(
    supabase,
    session.profileId,
    quizId
  );
  if (
    livePresentation &&
    !presentationMatchesBank(livePresentation, shufflable)
  ) {
    throw appError(ErrorCode.QUIZ_CHANGED);
  }
  const snapshot = livePresentation ?? authoredPresentation(shufflable);

  const correctCount = graded.filter((g) => g.isCorrect).length;
  const score = Math.round((correctCount / graded.length) * 100);

  const { data: submission, error: subError } = await supabase
    .from("exam_submissions")
    .insert({
      student_id: session.profileId,
      quiz_id: quizId,
      score,
      question_order: snapshot.questionIds,
      option_orders: snapshot.optionOrders,
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

  const retakesRemain = canStartNewAttempt(used + 1, maxAttempts);
  if (retakesRemain && timedSession) {
    await supabase
      .from("quiz_timed_sessions")
      .delete()
      .eq("student_id", session.profileId)
      .eq("quiz_id", quizId);
  }

  await deleteLivePresentation(supabase, session.profileId, quizId);

  const byId = new Map(graded.map((g) => [g.id as string, g]));
  const orderedGraded = [
    ...snapshot.questionIds
      .map((id) => byId.get(id))
      .filter((row): row is (typeof graded)[number] => Boolean(row)),
    ...graded.filter((g) => !snapshot.questionIds.includes(g.id as string)),
  ];

  return {
    submissionId: submission.id,
    score,
    totalQuestions: orderedGraded.length,
    correctCount,
    answers: orderedGraded.map((g) => ({
      questionId: g.id as string,
      studentAnswer: g.studentAnswer,
      isCorrect: g.isCorrect,
      correctAnswer: g.correct_answer as string,
      explanationText: g.explanation_text as string,
      explanationMediaUrl: g.explanation_media_url as string | null,
      categoryTag: g.category_tag as string,
      questionText: g.question_text as string,
      questionImageUrl: g.question_image_url as string | null,
      options: snapshot.optionOrders[g.id as string] ?? g.options,
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

type StudentQuizBundle = {
  stats: StudentDashboardData["stats"];
  quizzes: QuizCarouselItem[];
  allScores: RecentScoreRow[];
  weakPoints: CategoryPerformance[];
  teachers: Awaited<ReturnType<typeof getStudentTeachers>>;
};

type QuizRowWithQuestionCount = Quiz & {
  questions: { count: number }[];
};

async function fetchStudentQuizBundle(
  session: Awaited<ReturnType<typeof requireStudent>>,
  ctx: Awaited<ReturnType<typeof getStudentContext>>,
  options?: { quizLimit?: number }
): Promise<StudentQuizBundle> {
  const [weakPoints, teachers] = await Promise.all([
    getWeakPoints(),
    getStudentTeachers(),
  ]);

  const emptyStats = {
    tier: ctx.tier,
    completedQuizCount: 0,
    overallAverageScore: 0,
  };

  if (!ctx.teacherId) {
    return {
      stats: emptyStats,
      quizzes: [],
      allScores: [],
      weakPoints,
      teachers,
    };
  }

  const supabase = createAdminClient();

  let quizQuery = supabase
    .from("quizzes")
    .select(`${QUIZ_LIST_SELECT}, questions(count)`)
    .eq("created_by", ctx.teacherId)
    .eq("is_active", true)
    .is("deleted_at", null)
    .order("created_at", { ascending: false });

  if (options?.quizLimit) {
    quizQuery = quizQuery.limit(options.quizLimit);
  }

  const { data: quizRows } = await quizQuery;

  if (!quizRows?.length) {
    return {
      stats: emptyStats,
      quizzes: [],
      allScores: [],
      weakPoints,
      teachers,
    };
  }

  const typedQuizRows = quizRows as QuizRowWithQuestionCount[];
  const quizIds = typedQuizRows.map((q) => q.id);

  const [{ data: submissionRows }, { data: assignmentRows }] = await Promise.all([
    supabase
      .from("exam_submissions")
      .select("id, score, submitted_at, quiz_id")
      .eq("student_id", session.profileId)
      .in("quiz_id", quizIds)
      .order("submitted_at", { ascending: false }),
    supabase
      .from("quiz_groups")
      .select("quiz_id, group_id")
      .in("quiz_id", quizIds),
  ]);

  const assignmentsByQuiz = indexQuizGroupAssignments(
    (assignmentRows ?? []) as Array<{ quiz_id: string; group_id: string }>
  );

  const visibleQuizRows = filterQuizzesVisibleToStudent(
    typedQuizRows,
    ctx.groupIds,
    assignmentsByQuiz
  );

  const categoryIds = Array.from(
    new Set(
      visibleQuizRows
        .map((quiz) => quiz.category_id)
        .filter((id): id is string => Boolean(id))
    )
  );

  const { data: categoryRows } = categoryIds.length
    ? await supabase.from("categories").select("id, name").in("id", categoryIds)
    : { data: [] as Array<{ id: string; name: string }> };

  const questionCountByQuiz = new Map<string, number>();
  for (const row of visibleQuizRows) {
    const count = row.questions?.[0]?.count ?? 0;
    if (count > 0) {
      questionCountByQuiz.set(row.id, count);
    }
  }

  const categoryNameById = new Map(
    (categoryRows ?? []).map((row) => [row.id as string, row.name as string])
  );

  const quizzesWithQuestions = new Set(questionCountByQuiz.keys());
  const submissionsByQuiz = new Map<
    string,
    Array<{ id: string; score: number; submitted_at: string }>
  >();
  for (const row of submissionRows ?? []) {
    const quizId = row.quiz_id as string;
    const list = submissionsByQuiz.get(quizId) ?? [];
    list.push({
      id: row.id as string,
      score: row.score as number,
      submitted_at: row.submitted_at as string,
    });
    submissionsByQuiz.set(quizId, list);
  }

  const quizzes: QuizCarouselItem[] = visibleQuizRows
    .filter((quiz) => quizzesWithQuestions.has(quiz.id))
    .map((row) => {
      const { questions, ...quiz } = row;
      const questionCount = questions?.[0]?.count ?? 0;
      const listItem = computeQuizListItem(
        quiz,
        {
          tier: ctx.tier,
          groupIds: ctx.groupIds,
        },
        assignmentsByQuiz.get(quiz.id)
      );
      const quizSubmissions = submissionsByQuiz.get(quiz.id) ?? [];
      const attemptState = buildAttemptState(
        quiz.max_attempts ?? 1,
        quizSubmissions
      );
      const latest = quizSubmissions.sort((a, b) =>
        b.submitted_at.localeCompare(a.submitted_at)
      )[0];

      return {
        ...listItem,
        questionCount,
        hasSubmission: attemptState.usedAttempts > 0,
        lastActivityAt: latest?.submitted_at ?? null,
        categoryName: quiz.category_id
          ? (categoryNameById.get(quiz.category_id) ?? "عام")
          : "عام",
        lastScore: attemptState.bestScore,
        bestScore: attemptState.bestScore,
        usedAttempts: attemptState.usedAttempts,
        maxAttempts: quiz.max_attempts ?? 1,
        canRetake: attemptState.canStartNewAttempt,
        estimatedMinutes: estimateQuizDurationMinutes(questionCount),
      };
    });

  const teacherQuizIds = new Set(quizzes.map((q) => q.id));
  const submissionScoreRows = (submissionRows ?? [])
    .filter((row) => teacherQuizIds.has(row.quiz_id as string))
    .map((row) => ({
      quizId: row.quiz_id as string,
      score: row.score as number,
    }));
  const gamifStats = aggregateSubmissionStats(submissionScoreRows);

  const quizMetaById = new Map(
    quizzes.map((quiz) => [
      quiz.id,
      { title: quiz.title, categoryName: quiz.categoryName },
    ])
  );

  const allScores: RecentScoreRow[] = (submissionRows ?? [])
    .filter((row) => teacherQuizIds.has(row.quiz_id as string))
    .map((row) => {
      const meta = quizMetaById.get(row.quiz_id as string);
      return {
        submissionId: row.id as string,
        quizId: row.quiz_id as string,
        quizTitle: meta?.title ?? "اختبار",
        score: row.score as number,
        submittedAt: row.submitted_at as string,
        categoryName: meta?.categoryName ?? "عام",
      };
    });

  return {
    stats: {
      tier: ctx.tier,
      completedQuizCount: gamifStats.totalQuizzesCompleted,
      overallAverageScore: Math.round(gamifStats.averageScorePercentage),
    },
    quizzes,
    allScores,
    weakPoints,
    teachers,
  };
}

export async function getStudentDashboardData(): Promise<StudentDashboardData> {
  const session = await requireStudent();
  const ctx = await getStudentContext(session);
  const bundle = await fetchStudentQuizBundle(session, ctx, {
    quizLimit: STUDENT_HOME_QUIZ_WINDOW,
  });

  return {
    stats: bundle.stats,
    recentScores: bundle.allScores.slice(0, 5),
    quizzes: bundle.quizzes,
    weakPoints: bundle.weakPoints,
    teachers: bundle.teachers,
  };
}

export async function getStudentQuizzesPageData(
  pageInput?: PageInput
): Promise<{
  stats: StudentDashboardData["stats"];
  quizzes: PagedResult<QuizCarouselItem>;
  continueQuiz: QuizCarouselItem | null;
}> {
  const session = await requireStudent();
  const ctx = await getStudentContext(session);
  const bundle = await fetchStudentQuizBundle(session, ctx);

  const pageSize = pageInput?.pageSize ?? STUDENT_EXAMS_PAGE_SIZE;
  const requestedPage = pageInput?.page ?? 1;
  const total = bundle.quizzes.length;
  const page = clampPage(requestedPage, pageSize, total);
  const { from, to } = rangeFromPage(page, pageSize);
  const items = bundle.quizzes.slice(from, to + 1);

  return {
    stats: bundle.stats,
    quizzes: toPagedResult(items, total, page, pageSize),
    continueQuiz: pickContinueQuiz(bundle.quizzes),
  };
}

export async function getStudentResultsPageData(): Promise<{
  stats: StudentDashboardData["stats"];
  scores: RecentScoreRow[];
  totalQuizzes: number;
}> {
  const session = await requireStudent();
  const ctx = await getStudentContext(session);
  const bundle = await fetchStudentQuizBundle(session, ctx);

  return {
    stats: bundle.stats,
    scores: bundle.allScores,
    totalQuizzes: bundle.quizzes.length,
  };
}

export async function getAvailableQuizzes(): Promise<QuizListItem[]> {
  const session = await requireStudent();
  const supabase = createAdminClient();
  const ctx = await getStudentContext(session);

  if (!ctx.teacherId) return [];

  const { data } = await supabase
    .from("quizzes")
    .select(`${QUIZ_LIST_SELECT}, questions(count)`)
    .eq("created_by", ctx.teacherId)
    .eq("is_active", true)
    .is("deleted_at", null)
    .order("created_at", { ascending: false });

  if (!data?.length) return [];

  const quizIds = (data as QuizRowWithQuestionCount[]).map((row) => row.id);
  const { data: assignmentRows } = await supabase
    .from("quiz_groups")
    .select("quiz_id, group_id")
    .in("quiz_id", quizIds);

  const assignmentsByQuiz = indexQuizGroupAssignments(
    (assignmentRows ?? []) as Array<{ quiz_id: string; group_id: string }>
  );

  const visibleRows = filterQuizzesVisibleToStudent(
    (data as QuizRowWithQuestionCount[]).filter(
      (row) => (row.questions?.[0]?.count ?? 0) > 0
    ),
    ctx.groupIds,
    assignmentsByQuiz
  );

  return visibleRows.map((row) => {
    const { questions, ...quiz } = row;
    void questions;
    return computeQuizListItem(
      quiz as Quiz,
      {
        tier: ctx.tier,
        groupIds: ctx.groupIds,
      },
      assignmentsByQuiz.get(row.id)
    );
  });
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

export type ChallengeLeaderboardEntry = {
  rank: number;
  studentId: string;
  displayName: string;
  score: number;
  submittedAt: string;
};

export async function getChallengeLeaderboard(quizId: string): Promise<{
  entries: ChallengeLeaderboardEntry[];
  viewerEntry: ChallengeLeaderboardEntry | null;
}> {
  const session = await requireStudent();
  const supabase = createAdminClient();
  const ctx = await getStudentContext(session);

  if (!ctx.teacherId) {
    throw appError(ErrorCode.SUBSCRIPTION_REQUIRED);
  }

  const { data: quiz } = await supabase
    .from("quizzes")
    .select(QUIZ_LIST_SELECT)
    .eq("id", quizId)
    .eq("created_by", ctx.teacherId)
    .eq("is_active", true)
    .maybeSingle<Quiz>();

  if (!quiz || quiz.assessment_category !== "challenge") {
    return { entries: [], viewerEntry: null };
  }

  if (ctx.tier === "free" && !quiz.is_free) {
    throw appError(ErrorCode.PRO_REQUIRED);
  }

  const { data: linkedStudents } = await supabase
    .from("student_teachers")
    .select("student_id")
    .eq("teacher_id", ctx.teacherId)
    .eq("status", "active");

  const studentIds = (linkedStudents ?? []).map((r) => r.student_id as string);
  if (studentIds.length === 0) {
    return { entries: [], viewerEntry: null };
  }

  const { data: submissions } = await supabase
    .from("exam_submissions")
    .select("student_id, score, submitted_at")
    .eq("quiz_id", quizId)
    .in("student_id", studentIds);

  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, full_name")
    .in("id", studentIds);

  const nameById = new Map(
    (profiles ?? []).map((p) => [p.id as string, p.full_name as string])
  );

  const ranked = rankChallengeLeaderboard(
    (submissions ?? []).map((row) => ({
      studentId: row.student_id as string,
      displayName: nameById.get(row.student_id as string) ?? "طالب",
      score: row.score as number,
      submittedAt: row.submitted_at as string,
    }))
  );

  const entries: ChallengeLeaderboardEntry[] = ranked.map((row) => ({
    rank: row.rank,
    studentId: row.studentId,
    displayName: row.displayName,
    score: row.score,
    submittedAt: row.submittedAt,
  }));

  const viewerEntry = entries.find((e) => e.studentId === session.profileId) ?? null;

  return { entries, viewerEntry };
}
