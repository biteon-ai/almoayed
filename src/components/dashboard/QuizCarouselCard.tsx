"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { requestProUpgrade } from "@/actions/student";
import type { QuizCarouselItem } from "@/types/database";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Crown, FileQuestion, Lock } from "lucide-react";
import { cn } from "@/lib/utils";
import { SPEKIT, spekit } from "@/lib/spekit-targets";

interface QuizCarouselCardProps {
  quiz: QuizCarouselItem;
}

const NEW_QUIZ_DAYS = 7;

function isRecentlyCreated(createdAt: string): boolean {
  const created = new Date(createdAt).getTime();
  const cutoff = Date.now() - NEW_QUIZ_DAYS * 24 * 60 * 60 * 1000;
  return created >= cutoff;
}

function QuestionMeta({ count }: { count: number }) {
  return (
    <div className="flex items-center gap-2 text-sm text-slate-500">
      <FileQuestion className="size-4 shrink-0 text-brand-500/90" aria-hidden />
      <span>
        {count} {count === 1 ? "سؤال" : "أسئلة"}
      </span>
    </div>
  );
}

function StatusBadge({ quiz }: { quiz: QuizCarouselItem }) {
  if (quiz.isLocked) return null;

  if (quiz.hasSubmission) {
    return (
      <Badge
        variant="outline"
        className="border-amber-200/80 bg-amber-50 text-[10px] font-bold text-amber-700"
      >
        قيد التقدم
      </Badge>
    );
  }

  if (isRecentlyCreated(quiz.created_at)) {
    return (
      <Badge
        variant="outline"
        className="border-sky-200/80 bg-sky-50 text-[10px] font-bold text-sky-700"
      >
        جديد
      </Badge>
    );
  }

  return null;
}

const cardShell = cn(
  "relative flex min-h-[190px] flex-col rounded-2xl border border-slate-100 bg-white p-5 shadow-sm",
  "transition-all duration-200 hover:shadow-md"
);

const ctaClasses = cn(
  buttonVariants({ variant: "default", size: "lg" }),
  "h-12 w-full rounded-xl text-sm font-bold",
  "transition-transform duration-200 hover:scale-[1.01] hover:bg-brand-700 active:scale-[0.99]"
);

export function QuizCarouselCard({ quiz }: QuizCarouselCardProps) {
  if (quiz.isLocked) {
    return <LockedQuizCarouselCard quiz={quiz} />;
  }

  return (
    <article className={cardShell} data-spekit={SPEKIT.studentQuizItem}>
      <div className="absolute start-4 top-4">
        <StatusBadge quiz={quiz} />
      </div>

      <h3 className="mb-3 line-clamp-2 flex-1 pe-2 ps-0 pt-1 font-bold text-base text-slate-800 md:text-lg">
        {quiz.title}
      </h3>

      <QuestionMeta count={quiz.questionCount} />

      <div className="mt-auto pt-5">
        <Link href={`/quiz/${quiz.id}`} className={ctaClasses}>
          {quiz.hasSubmission ? "متابعة" : "ابدأ الآن"}
        </Link>
      </div>
    </article>
  );
}

function LockedQuizCarouselCard({ quiz }: QuizCarouselCardProps) {
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  return (
    <article
      className={cn(
        cardShell,
        "border-amber-100/80 bg-gradient-to-br from-amber-50/50 to-white"
      )}
      {...spekit(SPEKIT.proUpgradeCard)}
    >
      <Badge className="absolute end-4 top-4 gap-0.5 border-0 bg-gradient-to-l from-amber-500 to-orange-500 px-2.5 py-0.5 text-[10px] font-bold text-white shadow-sm hover:from-amber-500 hover:to-orange-500">
        <Crown className="size-3" />
        Pro
      </Badge>

      <div className="mb-2 flex items-center gap-1.5 pt-8 text-amber-700/90">
        <Lock className="size-3.5 shrink-0" aria-hidden />
        <span className="text-[11px] font-semibold">يتطلب اشتراك Pro</span>
      </div>

      <h3 className="mb-3 line-clamp-2 flex-1 font-bold text-base text-slate-800 md:text-lg">
        {quiz.title}
      </h3>

      <QuestionMeta count={quiz.questionCount} />

      <div className="mt-auto space-y-2 pt-5">
        <Button
          size="lg"
          className={cn(
            "h-12 w-full gap-2 rounded-xl bg-gradient-to-l from-amber-500 to-orange-500 text-sm font-bold shadow-sm",
            "transition-transform duration-200 hover:scale-[1.01] hover:from-amber-600 hover:to-orange-600 active:scale-[0.99]"
          )}
          disabled={pending}
          onClick={() => {
            startTransition(async () => {
              const result = await requestProUpgrade();
              setMessage(result.message);
            });
          }}
          {...spekit(SPEKIT.proUpgradeRequestButton)}
        >
          <Crown className="size-4" />
          {pending ? "عم يُرسل الطلب..." : "طلب الترقية إلى Pro"}
        </Button>
        {message && (
          <p className="text-center text-xs leading-snug text-brand-700">
            {message}
          </p>
        )}
      </div>
    </article>
  );
}
