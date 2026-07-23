"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { requestProUpgrade } from "@/actions/student";
import { useStudentLoadingBarSync } from "@/components/layout/StudentPortalShell";
import type { QuizCarouselItem } from "@/types/database";
import { Button } from "@/components/ui/button"
import { buttonVariants } from "@/components/ui/button-variants";
import { Crown, FileText, Lock } from "lucide-react";
import { cn } from "@/lib/utils";
import { SPEKIT, spekit } from "@/lib/spekit-targets";

interface QuizCarouselCardProps {
  quiz: QuizCarouselItem;
  variant?: "default" | "featured";
}

const NEW_QUIZ_DAYS = 7;

function isRecentlyCreated(createdAt: string): boolean {
  const created = new Date(createdAt).getTime();
  const cutoff = Date.now() - NEW_QUIZ_DAYS * 24 * 60 * 60 * 1000;
  return created >= cutoff;
}

function QuestionMeta({ count }: { count: number }) {
  return (
    <p className="inline-flex items-center gap-1.5 text-sm text-slate-500">
      <FileText
        className="size-4 shrink-0 text-brand-500/90"
        aria-hidden
      />
      <span className="font-medium tabular-nums">
        {count} {count === 1 ? "سؤال" : "أسئلة"}
      </span>
    </p>
  );
}

function InProgressBadge() {
  return (
    <span className="rounded-md border border-amber-100 bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-700">
      قيد التقدم
    </span>
  );
}

function NewBadge() {
  return (
    <span className="rounded-md border border-sky-100 bg-sky-50 px-2.5 py-1 text-xs font-medium text-sky-700">
      جديد
    </span>
  );
}

function ProBadge() {
  return (
    <span className="inline-flex items-center gap-1 rounded-md border-0 bg-gradient-to-l from-amber-500 to-orange-500 px-2.5 py-1 text-xs font-bold text-white shadow-sm">
      <Crown className="size-3" aria-hidden />
      Pro
    </span>
  );
}

function StatusBadgeRow({ quiz }: { quiz: QuizCarouselItem }) {
  if (quiz.isLocked) {
    return (
      <div className="flex w-full items-center justify-between gap-2">
        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-700/90">
          <Lock className="size-3.5 shrink-0" aria-hidden />
          يتطلب اشتراك Pro
        </span>
        <ProBadge />
      </div>
    );
  }

  if (quiz.hasSubmission) {
    return (
      <div className="flex w-full items-center justify-between gap-2">
        <InProgressBadge />
      </div>
    );
  }

  if (isRecentlyCreated(quiz.created_at)) {
    return (
      <div className="flex w-full items-center justify-between gap-2">
        <NewBadge />
      </div>
    );
  }

  return null;
}

const ctaClasses = cn(
  buttonVariants({ variant: "default", size: "lg" }),
  "h-12 w-full rounded-xl text-sm font-bold",
  "bg-brand-600 text-white shadow-sm",
  "transition-all duration-200 hover:scale-[1.02] hover:bg-brand-700 hover:shadow-md active:scale-[0.99]"
);

export function QuizCarouselCard({
  quiz,
  variant = "default",
}: QuizCarouselCardProps) {
  if (quiz.isLocked) {
    return <LockedQuizCarouselCard quiz={quiz} />;
  }

  const featured = variant === "featured";

  return (
    <article
      className={cn(
        "flex min-h-[190px] flex-col rounded-2xl border bg-white p-5 shadow-sm transition-all duration-200 hover:shadow-md",
        featured
          ? "border-emerald-200/90 bg-gradient-to-br from-emerald-50/50 to-white p-6 ring-1 ring-emerald-100/80 md:min-h-[210px]"
          : "border-slate-100"
      )}
      data-spekit={SPEKIT.studentQuizItem}
    >
      <div className="flex flex-1 flex-col gap-2">
        <StatusBadgeRow quiz={quiz} />
        <h3
          className={cn(
            "line-clamp-2 font-bold text-slate-800",
            featured ? "text-xl md:text-2xl" : "text-lg"
          )}
        >
          {quiz.title}
        </h3>
      </div>

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
  useStudentLoadingBarSync(pending);

  return (
    <article
      className={cn(
        "flex min-h-[190px] flex-col rounded-2xl border border-amber-100/80 bg-gradient-to-br from-amber-50/50 to-white p-5 shadow-sm",
        "transition-all duration-200 hover:shadow-md"
      )}
      {...spekit(SPEKIT.proUpgradeCard)}
    >
      <div className="flex flex-1 flex-col gap-2">
        <StatusBadgeRow quiz={quiz} />
        <h3 className="line-clamp-2 text-lg font-bold text-slate-800">
          {quiz.title}
        </h3>
      </div>

      <QuestionMeta count={quiz.questionCount} />

      <div className="mt-auto space-y-2 pt-5">
        <Button
          size="lg"
          className={cn(
            "h-12 w-full gap-2 rounded-xl bg-gradient-to-l from-amber-500 to-orange-500 text-sm font-bold shadow-sm",
            "transition-all duration-200 hover:scale-[1.02] hover:from-amber-600 hover:to-orange-600 hover:shadow-md active:scale-[0.99]"
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
