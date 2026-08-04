import { notFound, redirect } from "next/navigation";
import {
  getChallengeLeaderboard,
  getQuizForStudent,
  getSubmissionResults,
} from "@/actions/quiz";
import { ChallengeLeaderboard } from "@/components/quiz/ChallengeLeaderboard";
import {
  countUniqueCompletedQuizzes,
  getStudentProfileState,
} from "@/actions/profile";
import { QuizRunnerContainer } from "@/components/quiz/QuizRunnerContainer";
import { buttonVariants } from "@/components/ui/button-variants";
import { ArrowRight, AlertCircle } from "lucide-react";
import { SPEKIT } from "@/lib/spekit-targets";
import { shouldBlockNewQuiz } from "@/lib/student-profile";
import { AppError, ErrorCode, toUserMessage } from "@/lib/app-errors";
import { getActiveTeacherId, requireStudent } from "@/lib/auth";

interface QuizPageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ review?: string }>;
}

export async function generateMetadata({ params }: QuizPageProps) {
  const { id } = await params;
  try {
    const { quiz } = await getQuizForStudent(id);
    return {
      title: quiz ? `${quiz.title} | المؤيد` : "اختبار | المؤيد",
    };
  } catch {
    return { title: "اختبار | المؤيد" };
  }
}

export default async function QuizPage({ params, searchParams }: QuizPageProps) {
  const { id } = await params;
  const { review: reviewSubmissionId } = await searchParams;
  const session = await requireStudent();
  const teacherId =
    session.currentTeacherId ?? (await getActiveTeacherId(session)) ?? "";

  let data;
  let accessError: string | null = null;

  try {
    data = await getQuizForStudent(id);
  } catch (e) {
    if (e instanceof AppError && e.code === ErrorCode.SUBSCRIPTION_REQUIRED) {
      redirect("/login");
    }
    accessError = toUserMessage(e);
  }

  if (accessError) {
    return (
      <div
        className="flex min-h-[60vh] flex-col items-center justify-center gap-4 px-6 text-center"
        data-spekit={SPEKIT.quizPage}
      >
        <AlertCircle className="size-10 text-destructive" aria-hidden />
        <p className="max-w-sm text-sm font-bold text-foreground" role="alert">
          {accessError}
        </p>
        <a href="/dashboard" className={buttonVariants({ variant: "outline" })}>
          <ArrowRight className="size-4" />
          رجوع للرئيسية
        </a>
      </div>
    );
  }

  const { quiz, questions, existingSubmissionId, attemptState, timer } = data!;

  if (!quiz) {
    notFound();
  }

  const [profileState, uniqueCompletedQuizzes, leaderboard] = await Promise.all([
    getStudentProfileState(),
    countUniqueCompletedQuizzes(session.profileId),
    quiz.assessment_category === "challenge"
      ? getChallengeLeaderboard(id)
      : Promise.resolve({ entries: [], viewerEntry: null }),
  ]);

  const explicitReviewId = reviewSubmissionId?.trim() || null;
  const isExplicitReview = Boolean(explicitReviewId);

  if (
    !isExplicitReview &&
    shouldBlockNewQuiz({
      profileCompleted: profileState.profileCompleted,
      uniqueCompletedQuizzes,
      hasSubmissionForQuiz: attemptState.usedAttempts > 0,
    }) &&
    attemptState.canStartNewAttempt
  ) {
    redirect(`/profile/complete?from=${encodeURIComponent(`/quiz/${id}`)}`);
  }

  const reviewId =
    explicitReviewId ??
    (existingSubmissionId && !attemptState.canStartNewAttempt
      ? existingSubmissionId
      : null);

  const initialResults = reviewId
    ? await getSubmissionResults(reviewId)
    : null;

  return (
    <div data-spekit={SPEKIT.quizPage} className="space-y-4">
      {quiz.assessment_category === "challenge" ? (
        <div className="px-4 pt-4">
          <ChallengeLeaderboard
            entries={leaderboard.entries}
            viewerEntry={leaderboard.viewerEntry}
          />
        </div>
      ) : null}
      <QuizRunnerContainer
        teacherId={teacherId}
        quiz={quiz}
        questions={questions}
        initialResults={initialResults}
        timer={
          initialResults || !attemptState.canStartNewAttempt ? null : timer
        }
        attemptState={attemptState}
      />
    </div>
  );
}
