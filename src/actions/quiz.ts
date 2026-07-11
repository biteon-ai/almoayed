"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { requireStudent, getActiveTeacherId } from "@/lib/auth";
import type {
  CategoryPerformance,
  ExamQuestion,
  Quiz,
  QuizListItem,
  QuizSubmitResult,
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
    throw new Error("SUBSCRIPTION_REQUIRED");
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
    throw new Error("PRO_REQUIRED");
  }

  if (quiz.quiz_type === "session_group" && quiz.target_group_id) {
    if (!ctx.groupIds.includes(quiz.target_group_id)) {
      throw new Error("GROUP_REQUIRED");
    }
  }

  const { data: questions } = await supabase
    .from("questions")
    .select(
      "id, quiz_id, question_text, question_image_url, options, sort_order"
    )
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
    throw new Error("صار خطأ بجلب أسئلة الاختبار. جرّب مرة تانية.");
  }

  if (!questions?.length) {
    throw new Error("هذا الاختبار ما فيه أسئلة بعد. راجع الأستاذ.");
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
    throw new Error("ما قدرنا نحفظ إجاباتك. جرّب مرة تانية.");
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
    throw new Error("صار خطأ بحفظ الإجابات.");
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

  const stats = new Map<string, { total: number; correct: number }>();

  for (const row of answers) {
    const tag =
      (row.questions as unknown as { category_tag: string })?.category_tag ??
      "عام";
    const current = stats.get(tag) ?? { total: 0, correct: 0 };
    current.total += 1;
    if (row.is_correct) current.correct += 1;
    stats.set(tag, current);
  }

  return Array.from(stats.entries())
    .map(([category_tag, { total, correct }]) => ({
      category_tag,
      total_attempted: total,
      correct_count: correct,
      success_percentage: Math.round((correct / total) * 1000) / 10,
    }))
    .sort((a, b) => a.success_percentage - b.success_percentage);
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
    .map((quiz) => {
    const isGroupOk =
      quiz.quiz_type !== "session_group" ||
      !quiz.target_group_id ||
      ctx.groupIds.includes(quiz.target_group_id);

    const isAccessible =
      isGroupOk && (ctx.tier === "pro" || quiz.is_free);

    return {
      ...quiz,
      isAccessible,
      isLocked: !isAccessible && isGroupOk,
    };
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
