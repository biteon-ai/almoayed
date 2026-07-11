"use client";

import Link from "next/link";
import { useTransition } from "react";
import { updateQuizFlags } from "@/actions/teacher";
import type { Quiz } from "@/types/database";
import { StatusBadge } from "@/components/ui/status-badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ChevronLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import { SPEKIT, spekit } from "@/lib/spekit-targets";

export function QuizListItem({ quiz }: { quiz: Quiz }) {
  const [pending, startTransition] = useTransition();

  const toggle = (flags: Parameters<typeof updateQuizFlags>[1]) => {
    startTransition(() => updateQuizFlags(quiz.id, flags));
  };

  return (
    <Card
      className="overflow-hidden border-border/70 shadow-sm"
      {...spekit(SPEKIT.quizListItem)}
    >
      <CardContent className="p-5">
        <div className="flex flex-col items-start gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="min-w-0 flex-1 space-y-2.5 text-start">
            <h3 className="text-base font-semibold leading-snug text-foreground">
              {quiz.title}
            </h3>
            <div
              className="flex flex-wrap gap-2"
              {...spekit(SPEKIT.quizStatusBadges)}
            >
              <StatusBadge tone={quiz.is_active ? "active" : "hidden"}>
                {quiz.is_active ? "نشط" : "مخفي"}
              </StatusBadge>
              <StatusBadge tone={quiz.is_free ? "free" : "pro"}>
                {quiz.is_free ? "مجاني" : "Pro"}
              </StatusBadge>
              <StatusBadge
                tone={quiz.quiz_type === "session_group" ? "group" : "regular"}
              >
                {quiz.quiz_type === "session_group" ? "مجموعة" : "عادي"}
              </StatusBadge>
            </div>
          </div>

          <div
            className="flex w-full flex-wrap items-center gap-2 lg:w-auto lg:shrink-0"
            {...spekit(SPEKIT.quizToggleActions)}
          >
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="h-9 px-3"
              disabled={pending}
              onClick={() => toggle({ is_active: !quiz.is_active })}
            >
              {quiz.is_active ? "إخفاء" : "تفعيل"}
            </Button>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              className="h-9 px-3"
              disabled={pending}
              onClick={() => toggle({ is_free: !quiz.is_free })}
            >
              {quiz.is_free ? "تحويل لـ Pro" : "تحويل لمجاني"}
            </Button>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              className="h-9 px-3"
              disabled={pending}
              onClick={() =>
                toggle({
                  quiz_type:
                    quiz.quiz_type === "regular" ? "session_group" : "regular",
                })
              }
            >
              {quiz.quiz_type === "regular" ? "مجموعة خاصة" : "اختبار عادي"}
            </Button>
            <Link
              href={`/teacher/quizzes/${quiz.id}`}
              className={cn(
                buttonVariants({ variant: "link", size: "sm" }),
                "inline-flex h-9 items-center gap-1 px-2 font-semibold text-brand-700"
              )}
              {...spekit(SPEKIT.quizEditLink)}
            >
              تحرير
              <ChevronLeft className="size-4 shrink-0" aria-hidden />
            </Link>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
