import type { createAdminClient } from "@/lib/supabase/admin";
import type {
  AttemptPresentation,
  ExamQuestion,
  QuizSubmitResult,
} from "@/types/database";

type AdminClient = ReturnType<typeof createAdminClient>;

type LivePresentationRow = {
  question_ids: string[] | null;
  option_orders: Record<string, string[]> | null;
};

function sortedCopy(values: string[]): string[] {
  return [...values].sort();
}

export function isPermutation(actual: string[], expected: string[]): boolean {
  if (actual.length !== expected.length) return false;
  const a = sortedCopy(actual);
  const b = sortedCopy(expected);
  return a.every((value, index) => value === b[index]);
}

export function presentationsEqual(
  a: AttemptPresentation,
  b: AttemptPresentation
): boolean {
  if (a.questionIds.length !== b.questionIds.length) return false;
  if (!a.questionIds.every((id, index) => id === b.questionIds[index])) {
    return false;
  }
  for (const id of a.questionIds) {
    const left = a.optionOrders[id] ?? [];
    const right = b.optionOrders[id] ?? [];
    if (!left.every((value, index) => value === right[index]) || left.length !== right.length) {
      return false;
    }
  }
  return true;
}

export function authoredPresentation(
  questions: Array<{ id: string; options: string[] }>
): AttemptPresentation {
  return {
    questionIds: questions.map((question) => question.id),
    optionOrders: Object.fromEntries(
      questions.map((question) => [question.id, [...question.options]])
    ),
  };
}

export function presentationMatchesBank(
  presentation: AttemptPresentation,
  questions: Array<{ id: string; options: string[] }>
): boolean {
  const ids = questions.map((question) => question.id);
  if (!isPermutation(presentation.questionIds, ids)) return false;
  for (const question of questions) {
    const order = presentation.optionOrders[question.id];
    if (!order || !isPermutation(order, question.options)) return false;
  }
  return true;
}

export function applyPresentation(
  questions: ExamQuestion[],
  presentation: AttemptPresentation
): ExamQuestion[] {
  const byId = new Map(questions.map((question) => [question.id, question]));
  const ordered: ExamQuestion[] = [];
  for (const id of presentation.questionIds) {
    const question = byId.get(id);
    if (!question) continue;
    const shuffled = presentation.optionOrders[id];
    ordered.push({
      ...question,
      options:
        shuffled && isPermutation(shuffled, question.options)
          ? shuffled
          : question.options,
    });
  }
  return ordered;
}

export function presentationFromSubmitResult(
  result: QuizSubmitResult
): AttemptPresentation {
  return {
    questionIds: result.answers.map((answer) => answer.questionId),
    optionOrders: Object.fromEntries(
      result.answers.map((answer) => [answer.questionId, [...(answer.options ?? [])]])
    ),
  };
}

export function parseOptionOrders(
  raw: unknown
): Record<string, string[]> {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return {};
  const out: Record<string, string[]> = {};
  for (const [key, value] of Object.entries(raw as Record<string, unknown>)) {
    if (Array.isArray(value) && value.every((item) => typeof item === "string")) {
      out[key] = value;
    }
  }
  return out;
}

export function parseQuestionIds(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  return raw.filter((id): id is string => typeof id === "string");
}

export function rowToPresentation(
  row: LivePresentationRow | null
): AttemptPresentation | null {
  if (!row) return null;
  const questionIds = parseQuestionIds(row.question_ids);
  if (questionIds.length === 0) return null;
  return {
    questionIds,
    optionOrders: parseOptionOrders(row.option_orders),
  };
}

export async function loadLivePresentation(
  supabase: AdminClient,
  studentId: string,
  quizId: string
): Promise<AttemptPresentation | null> {
  const { data, error } = await supabase
    .from("quiz_attempt_presentations")
    .select("question_ids, option_orders")
    .eq("student_id", studentId)
    .eq("quiz_id", quizId)
    .maybeSingle();

  if (error) return null;
  return rowToPresentation((data as LivePresentationRow | null) ?? null);
}

export async function upsertLivePresentation(
  supabase: AdminClient,
  studentId: string,
  quizId: string,
  presentation: AttemptPresentation
): Promise<void> {
  const { error } = await supabase.from("quiz_attempt_presentations").upsert(
    {
      student_id: studentId,
      quiz_id: quizId,
      question_ids: presentation.questionIds,
      option_orders: presentation.optionOrders,
    },
    { onConflict: "student_id,quiz_id" }
  );
  if (error) {
    return;
  }
}

export async function deleteLivePresentation(
  supabase: AdminClient,
  studentId: string,
  quizId: string
): Promise<void> {
  await supabase
    .from("quiz_attempt_presentations")
    .delete()
    .eq("student_id", studentId)
    .eq("quiz_id", quizId);
}

export async function loadSubmissionPresentation(
  supabase: AdminClient,
  submissionId: string,
  studentId: string
): Promise<AttemptPresentation | null> {
  const { data } = await supabase
    .from("exam_submissions")
    .select("question_order, option_orders")
    .eq("id", submissionId)
    .eq("student_id", studentId)
    .maybeSingle();

  if (!data) return null;
  const questionIds = parseQuestionIds(data.question_order);
  if (questionIds.length === 0) return null;
  return {
    questionIds,
    optionOrders: parseOptionOrders(data.option_orders),
  };
}
