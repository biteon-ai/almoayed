import { notFound, redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireStudent } from "@/lib/auth";

interface ResultReviewPageProps {
  params: Promise<{ submissionId: string }>;
}

/**
 * [UI-007] Review entry — verifies ownership then opens the quiz review
 * surface with this submission (answers/explanations only after submission — QUIZ-001).
 *
 * Deep links and bookmarks still use `/results/[submissionId]`. The results list
 * prefers `/quiz/[id]?review=` to skip this hop when quizId is already known.
 */
export default async function ResultReviewPage({
  params,
}: ResultReviewPageProps) {
  const { submissionId } = await params;
  const session = await requireStudent();
  const supabase = createAdminClient();

  const { data: submission } = await supabase
    .from("exam_submissions")
    .select("quiz_id")
    .eq("id", submissionId)
    .eq("student_id", session.profileId)
    .maybeSingle();

  if (!submission?.quiz_id) {
    notFound();
  }

  redirect(
    `/quiz/${submission.quiz_id as string}?review=${encodeURIComponent(submissionId)}`
  );
}
