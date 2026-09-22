"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { requestProUpgrade } from "@/actions/student";
import { useStudentLoadingBarSync } from "@/components/layout/StudentPortalShell";
import type { QuizCarouselItem } from "@/types/database";
import {
  formatDurationAr,
  getQuizCardStatus,
  getQuizListAction,
  isRecentlyCreatedQuiz,
} from "@/lib/student-quiz-ui";
import { formatAttemptProgressAr } from "@/lib/quiz-attempts";
import { quizPlayerHref } from "@/lib/quiz-route-prefetch";
import { usePrefetchOnIntent } from "@/hooks/use-prefetch-on-intent";
import { Button } from "@/components/ui/button"
import { buttonVariants } from "@/components/ui/button-variants";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { SPEKIT, spekit } from "@/lib/spekit-targets";
import { cn } from "@/lib/utils";
import {
  CheckCircle2,
  Clock,
  Crown,
  HelpCircle,
  Lock,
  Play,
  RotateCcw,
  Sparkles,
} from "lucide-react";

interface StudentQuizGridCardProps {
  quiz: QuizCarouselItem;
}

function TierBadge({ quiz }: { quiz: QuizCarouselItem }) {
  if (quiz.isLocked) {
    return (
      <Badge className="gap-1 border-amber-200/60 bg-amber-500/15 text-[10px] text-amber-700 dark:text-amber-300">
        <Crown className="h-3 w-3 fill-amber-500" />
        Pro
      </Badge>
    );
  }

  if (!quiz.is_free) {
    return (
      <Badge className="gap-1 border-amber-200/60 bg-amber-500/15 text-[10px] text-amber-700 dark:text-amber-300">
        <Crown className="h-3 w-3 fill-amber-500" />
        Pro
      </Badge>
    );
  }

  return (
    <Badge className="border-emerald-200 bg-emerald-50 text-[10px] text-emerald-700 dark:border-emerald-900/50 dark:bg-emerald-950/40 dark:text-emerald-300">
      مجاني
    </Badge>
  );
}

function StatusBadge({ quiz }: { quiz: QuizCarouselItem }) {
  const status = getQuizCardStatus(
    quiz,
    isRecentlyCreatedQuiz(quiz.created_at)
  );

  if (status === "locked") {
    return (
      <Badge className="gap-1 border-amber-200 bg-amber-50 text-[10px] text-amber-700">
        <Lock className="h-3 w-3" />
        مقفل
      </Badge>
    );
  }

  if (status === "completed") {
    return (
      <Badge className="border-emerald-200 bg-emerald-50 text-[10px] font-semibold text-emerald-700 dark:text-emerald-300">
        مكتمل {quiz.lastScore != null ? `(${quiz.lastScore}%)` : ""}
      </Badge>
    );
  }

  if (status === "new" && isRecentlyCreatedQuiz(quiz.created_at)) {
    return (
      <Badge className="gap-1 border-sky-200 bg-sky-50 text-[10px] text-sky-700">
        <Sparkles className="h-3 w-3" />
        جديد
      </Badge>
    );
  }

  return null;
}

export function StudentQuizGridCard({ quiz }: StudentQuizGridCardProps) {
  const href = quiz.isLocked ? null : quizPlayerHref(quiz.id);
  const { ref, intentProps } = usePrefetchOnIntent(href);

  if (quiz.isLocked) {
    return <LockedStudentQuizGridCard quiz={quiz} />;
  }

  const action = getQuizListAction(quiz);
  const playerHref = quizPlayerHref(quiz.id);
  const attemptLabel =
    quiz.maxAttempts > 0 && quiz.hasSubmission
      ? formatAttemptProgressAr(quiz.usedAttempts, quiz.maxAttempts)
      : null;

  return (
    <Card
      ref={ref}
      className="group flex flex-col justify-between rounded-2xl border bg-card transition-all hover:border-emerald-500/50 hover:shadow-lg"
      data-spekit={SPEKIT.studentQuizItem}
      {...intentProps}
    >
      <CardHeader className="p-5 pb-3">
        <div className="mb-2 flex items-center justify-between gap-2">
          <Badge className="text-[11px] font-medium" variant="outline">
            {quiz.categoryName}
          </Badge>
          <div className="flex items-center gap-1.5">
            <StatusBadge quiz={quiz} />
            <TierBadge quiz={quiz} />
          </div>
        </div>

        <CardTitle className="line-clamp-2 text-base font-bold leading-snug text-foreground transition-colors group-hover:text-emerald-600">
          {quiz.title}
        </CardTitle>
      </CardHeader>

      <CardContent className="px-5 py-2">
        <div className="flex items-center gap-4 rounded-xl bg-muted/30 p-2.5 text-xs text-muted-foreground">
          <span className="flex items-center gap-1.5 font-medium">
            <HelpCircle className="h-3.5 w-3.5 text-emerald-600" />
            {quiz.questionCount}{" "}
            {quiz.questionCount === 1 ? "سؤال" : "أسئلة"}
          </span>
          <span>•</span>
          <span className="flex items-center gap-1.5 font-medium">
            <Clock className="h-3.5 w-3.5 text-teal-600" />
            {formatDurationAr(quiz.estimatedMinutes)}
          </span>
        </div>
      </CardContent>

      <CardFooter className="p-5 pt-3">
        {action.kind === "start" ? (
          <Link
            href={playerHref}
            prefetch
            className={cn(
              buttonVariants({ size: "lg" }),
              "h-10 w-full gap-1.5 rounded-xl bg-emerald-600 text-xs font-bold text-white transition-all hover:bg-emerald-700 group-hover:shadow-md"
            )}
          >
            <Play className="h-3.5 w-3.5 fill-white" />
            <span>{action.label}</span>
          </Link>
        ) : (
          <Link
            href={playerHref}
            prefetch
            className={cn(
              buttonVariants({ variant: "outline", size: "lg" }),
              "h-10 w-full gap-1.5 rounded-xl border-emerald-200 text-xs font-bold text-emerald-700 hover:bg-emerald-50"
            )}
            {...(action.kind === "retake"
              ? spekit(SPEKIT.quizRetakeCta)
              : {})}
          >
            {action.kind === "retake" ? (
              <RotateCcw className="h-4 w-4 text-emerald-600" />
            ) : (
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            )}
            <span>
              {action.label}
              {action.kind === "review" && quiz.lastScore != null
                ? ` (${quiz.lastScore}%)`
                : ""}
            </span>
          </Link>
        )}
        {attemptLabel && action.kind === "retake" ? (
          <p
            className="mt-2 text-center text-[11px] text-muted-foreground"
            {...spekit(SPEKIT.quizAttemptBadge)}
          >
            {attemptLabel}
          </p>
        ) : null}
      </CardFooter>
    </Card>
  );
}

function LockedStudentQuizGridCard({ quiz }: StudentQuizGridCardProps) {
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  useStudentLoadingBarSync(pending);

  return (
    <Card
      className="group flex flex-col justify-between rounded-2xl border border-amber-200/70 bg-gradient-to-br from-amber-50/30 to-background transition-all hover:shadow-lg dark:from-amber-950/20"
      {...spekit(SPEKIT.proUpgradeCard)}
    >
      <CardHeader className="p-5 pb-3">
        <div className="mb-2 flex items-center justify-between gap-2">
          <Badge className="text-[11px] font-medium" variant="outline">
            {quiz.categoryName}
          </Badge>
          <TierBadge quiz={quiz} />
        </div>
        <CardTitle className="line-clamp-2 text-base font-bold leading-snug text-foreground">
          {quiz.title}
        </CardTitle>
      </CardHeader>

      <CardContent className="px-5 py-2">
        <div className="flex items-center gap-4 rounded-xl bg-muted/30 p-2.5 text-xs text-muted-foreground">
          <span className="flex items-center gap-1.5 font-medium">
            <HelpCircle className="h-3.5 w-3.5 text-emerald-600" />
            {quiz.questionCount}{" "}
            {quiz.questionCount === 1 ? "سؤال" : "أسئلة"}
          </span>
          <span>•</span>
          <span className="flex items-center gap-1.5 font-medium">
            <Clock className="h-3.5 w-3.5 text-teal-600" />
            {formatDurationAr(quiz.estimatedMinutes)}
          </span>
        </div>
      </CardContent>

      <CardFooter className="space-y-2 p-5 pt-3">
        <Button
          className="h-10 w-full gap-2 rounded-xl bg-gradient-to-l from-amber-500 to-orange-500 text-xs font-bold hover:from-amber-600 hover:to-orange-600"
          disabled={pending}
          onClick={() => {
            startTransition(async () => {
              const result = await requestProUpgrade();
              setMessage(result.message);
            });
          }}
          {...spekit(SPEKIT.proUpgradeRequestButton)}
        >
          <Crown className="h-4 w-4" />
          {pending ? "عم يُرسل الطلب..." : "طلب الترقية إلى Pro"}
        </Button>
        {message ? (
          <p className="text-center text-xs text-brand-700">{message}</p>
        ) : null}
      </CardFooter>
    </Card>
  );
}
