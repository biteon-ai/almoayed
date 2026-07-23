"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import type { TeacherQuiz } from "@/types/database";
import { Button } from "@/components/ui/button"
import { buttonVariants } from "@/components/ui/button-variants";
import { Card, CardContent } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/status-badge";
import { SPEKIT, spekit } from "@/lib/spekit-targets";
import { cn } from "@/lib/utils";
import {
  CheckCircle2,
  Crown,
  Edit3,
  EyeOff,
  FileText,
  Loader2,
  Sparkles,
  Users,
} from "lucide-react";

interface QuizListItemProps {
  quiz: TeacherQuiz;
  pending?: boolean;
  pendingQuizId?: string | null;
  onRequestToggleActive: (quiz: TeacherQuiz) => void;
  onToggleFree: (quiz: TeacherQuiz) => void;
}

/**
 * Quiz card row for teacher quiz management.
 * Activation requires confirmation in the parent (`QuizManagement`).
 * تفعيل is disabled when `question_count === 0`.
 */
export function QuizListItem({
  quiz,
  pending = false,
  pendingQuizId = null,
  onRequestToggleActive,
  onToggleFree,
}: QuizListItemProps) {
  const router = useRouter();
  const [isNavPending, startNavTransition] = useTransition();
  const [navigatingHref, setNavigatingHref] = useState<string | null>(null);
  const canActivate = quiz.question_count > 0;
  const isBusy = pending && pendingQuizId === quiz.id;
  const editHref = `/teacher/quizzes/${quiz.id}`;

  const navigateTo = (href: string) => {
    setNavigatingHref(href);
    startNavTransition(() => {
      router.push(href);
    });
  };

  const isLinkLoading = (href: string) =>
    isNavPending && navigatingHref === href;

  return (
    <Card
      className="rounded-xl border bg-card p-0 transition-all hover:shadow-md"
      {...spekit(SPEKIT.quizListItem)}
    >
      <CardContent className="p-4">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="min-w-0 flex-1 space-y-2.5 text-start">
            <h3 className="flex items-center gap-2 text-lg font-bold text-foreground">
              <FileText className="size-5 shrink-0 text-brand-600" />
              <span className="truncate">{quiz.title}</span>
            </h3>
            <div
              className="flex flex-wrap gap-2"
              {...spekit(SPEKIT.quizStatusBadges)}
            >
              <StatusBadge
                tone={quiz.is_active ? "active" : "hidden"}
                className="inline-flex items-center gap-1"
              >
                {quiz.is_active ? (
                  <CheckCircle2 className="size-3.5" />
                ) : (
                  <EyeOff className="size-3.5" />
                )}
                {quiz.is_active ? "نشط" : "مخفي"}
              </StatusBadge>
              <StatusBadge
                tone={quiz.is_free ? "free" : "pro"}
                className="inline-flex items-center gap-1"
              >
                {quiz.is_free ? (
                  <Sparkles className="size-3.5" />
                ) : (
                  <Crown className="size-3.5" />
                )}
                {quiz.is_free ? "مجاني" : "Pro"}
              </StatusBadge>
              <StatusBadge
                tone={quiz.quiz_type === "session_group" ? "group" : "regular"}
                className="inline-flex items-center gap-1"
              >
                <Users className="size-3.5" />
                {quiz.quiz_type === "session_group" ? "مجموعة" : "عادي"}
              </StatusBadge>
              <span className="text-xs text-muted-foreground">
                {quiz.question_count} سؤال
              </span>
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
              className="h-10 gap-1.5 px-3"
              disabled={pending || (!quiz.is_active && !canActivate)}
              title={
                !quiz.is_active && !canActivate
                  ? "أضف سؤالاً واحداً على الأقل قبل التفعيل"
                  : undefined
              }
              onClick={() => onRequestToggleActive(quiz)}
            >
              {isBusy ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : quiz.is_active ? (
                <>
                  <EyeOff className="size-3.5" />
                  إخفاء
                </>
              ) : (
                <>
                  <CheckCircle2 className="size-3.5" />
                  تفعيل
                </>
              )}
            </Button>

            <Button
              type="button"
              size="sm"
              variant="ghost"
              className="h-10 gap-1.5 px-3"
              disabled={pending}
              onClick={() => onToggleFree(quiz)}
            >
              {isBusy ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : (
                <Crown className="size-3.5" />
              )}
              {quiz.is_free ? "تحويل لـ Pro" : "تحويل لمجاني"}
            </Button>

            <Link
              href={editHref}
              onClick={(event) => {
                event.preventDefault();
                navigateTo(editHref);
              }}
              className={cn(
                buttonVariants({ variant: "outline", size: "sm" }),
                "inline-flex h-10 items-center gap-1.5 px-3",
                isLinkLoading(editHref) && "pointer-events-none opacity-70"
              )}
              title="إعدادات المجموعة"
            >
              {isLinkLoading(editHref) ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : (
                <Users className="size-3.5" />
              )}
              مجموعة
            </Link>

            <Link
              href={editHref}
              onClick={(event) => {
                event.preventDefault();
                navigateTo(editHref);
              }}
              className={cn(
                buttonVariants({ variant: "brand", size: "sm" }),
                "inline-flex h-10 items-center gap-1.5 px-3",
                isLinkLoading(editHref) && "pointer-events-none opacity-70"
              )}
              {...spekit(SPEKIT.quizEditLink)}
            >
              {isLinkLoading(editHref) ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : (
                <Edit3 className="size-3.5" />
              )}
              تحرير
            </Link>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
