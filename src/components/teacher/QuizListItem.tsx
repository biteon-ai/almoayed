"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import type { TeacherQuiz } from "@/types/database";
import { teacherQuizHref } from "@/lib/teacher-quiz-path";
import { Button } from "@/components/ui/button";
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
  Trash2,
  Users,
} from "lucide-react";

interface QuizListItemProps {
  quiz: TeacherQuiz;
  mode?: "active" | "trash";
  pending?: boolean;
  pendingQuizId?: string | null;
  onRequestToggleActive?: (quiz: TeacherQuiz) => void;
  onToggleFree?: (quiz: TeacherQuiz) => void;
  onSoftDelete?: (quiz: TeacherQuiz) => void;
  onRestore?: (quiz: TeacherQuiz) => void;
  onRequestPermanentDelete?: (quiz: TeacherQuiz) => void;
  onAssignGroups?: (quiz: TeacherQuiz) => void;
}

/**
 * Quiz card row for teacher quiz management (active or Trash).
 * Activation requires confirmation in the parent (`QuizManagement`).
 * تفعيل is disabled when `question_count === 0`.
 */
export function QuizListItem({
  quiz,
  mode = "active",
  pending = false,
  pendingQuizId = null,
  onRequestToggleActive,
  onToggleFree,
  onSoftDelete,
  onRestore,
  onRequestPermanentDelete,
  onAssignGroups,
}: QuizListItemProps) {
  const router = useRouter();
  const [isNavPending, startNavTransition] = useTransition();
  const [navigatingHref, setNavigatingHref] = useState<string | null>(null);
  const canActivate = quiz.question_count > 0;
  const isBusy = pending && pendingQuizId === quiz.id;
  const editHref = teacherQuizHref(quiz.slug);
  const isTrash = mode === "trash";

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
      className={cn(
        "relative rounded-xl border bg-card p-0 transition-all hover:shadow-md",
        "before:absolute before:inset-y-3 before:start-0 before:w-1 before:rounded-full",
        quiz.is_active
          ? "border-emerald-200/80 before:bg-emerald-500 shadow-sm ring-1 ring-emerald-500/10"
          : "border-border/70 bg-muted/15 before:bg-slate-300 opacity-[0.96]",
        !quiz.is_free && quiz.is_active && "bg-gradient-to-l from-amber-50/40 to-card"
      )}
      {...spekit(SPEKIT.quizListItem)}
    >
      <CardContent className="p-4">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="min-w-0 flex-1 space-y-2.5 ps-2 text-start">
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
              >
                {quiz.is_active ? (
                  <CheckCircle2 className="size-3.5 shrink-0" aria-hidden />
                ) : (
                  <EyeOff className="size-3.5 shrink-0" aria-hidden />
                )}
                {quiz.is_active ? "نشط" : "مخفي"}
              </StatusBadge>
              <StatusBadge
                tone={quiz.is_free ? "free" : "pro"}
              >
                {quiz.is_free ? (
                  <Sparkles className="size-3.5 shrink-0" aria-hidden />
                ) : (
                  <Crown className="size-3.5 shrink-0" aria-hidden />
                )}
                {quiz.is_free ? "مجاني" : "Pro"}
              </StatusBadge>
              <StatusBadge
                tone={quiz.assigned_groups.length > 0 ? "group" : "regular"}
              >
                <Users className="size-3.5 shrink-0" aria-hidden />
                {quiz.assigned_groups.length > 0 ? "مجموعة" : "عادي"}
              </StatusBadge>
              <span className="text-xs text-muted-foreground">
                {quiz.question_count} سؤال
              </span>
            </div>
            {quiz.assigned_groups.length > 0 ? (
              <div
                className="flex flex-wrap items-center gap-1.5"
                {...spekit(SPEKIT.quizAssignedGroups)}
              >
                <span className="text-[11px] font-medium text-muted-foreground">
                  المجموعات:
                </span>
                {quiz.assigned_groups.map((group) => (
                  <span
                    key={group.id}
                    className="inline-flex items-center rounded-full border border-violet-200 bg-violet-50 px-2 py-0.5 text-[11px] font-semibold text-violet-800 dark:border-violet-900/40 dark:bg-violet-950/30 dark:text-violet-200"
                  >
                    {group.name}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-[11px] text-muted-foreground">
                متاح لكل الطلاب — اضغط «مجموعة» لتقييد الوصول
              </p>
            )}
          </div>

          <div
            className="flex w-full flex-wrap items-center gap-2 lg:w-auto lg:shrink-0"
            {...spekit(SPEKIT.quizToggleActions)}
          >
            {isTrash ? (
              <>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="h-10 gap-1.5 px-3"
                  disabled={pending}
                  onClick={() => onRestore?.(quiz)}
                  {...spekit(SPEKIT.quizRestoreAction)}
                >
                  {isBusy ? (
                    <Loader2 className="size-3.5 animate-spin" />
                  ) : null}
                  استعادة
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="destructive"
                  className="h-10 gap-1.5 px-3"
                  disabled={pending}
                  onClick={() => onRequestPermanentDelete?.(quiz)}
                  {...spekit(SPEKIT.quizPermanentDeleteAction)}
                >
                  {isBusy ? (
                    <Loader2 className="size-3.5 animate-spin" />
                  ) : (
                    <Trash2 className="size-3.5" />
                  )}
                  حذف نهائي
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
                  {...spekit(SPEKIT.quizEditLink)}
                >
                  {isLinkLoading(editHref) ? (
                    <Loader2 className="size-3.5 animate-spin" />
                  ) : (
                    <Edit3 className="size-3.5" />
                  )}
                  عرض
                </Link>
              </>
            ) : (
              <>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className={cn(
                    "h-10 gap-1.5 rounded-xl px-3 text-xs font-bold",
                    quiz.is_active
                      ? "border-slate-300 bg-slate-50 text-slate-700 hover:border-slate-400 hover:bg-slate-100"
                      : "border-emerald-300 bg-emerald-50 text-emerald-800 hover:border-emerald-400 hover:bg-emerald-100 shadow-sm shadow-emerald-600/10"
                  )}
                  disabled={pending || (!quiz.is_active && !canActivate)}
                  title={
                    !quiz.is_active && !canActivate
                      ? "أضف سؤالاً واحداً على الأقل قبل التفعيل"
                      : quiz.is_active
                        ? "إخفاء الاختبار عن الطلاب"
                        : "إظهار الاختبار للطلاب"
                  }
                  onClick={() => onRequestToggleActive?.(quiz)}
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
                  variant="outline"
                  className={cn(
                    "h-10 gap-1.5 rounded-xl px-3 text-xs font-bold",
                    quiz.is_free
                      ? "border-amber-300 bg-amber-50 text-amber-800 hover:border-amber-400 hover:bg-amber-100 shadow-sm shadow-amber-600/10"
                      : "border-slate-300 bg-slate-50 text-slate-700 hover:border-slate-400 hover:bg-slate-100"
                  )}
                  disabled={pending}
                  title={
                    quiz.is_free
                      ? "جعله متاحاً لطلاب Pro فقط"
                      : "جعله مجانياً لكل الطلاب"
                  }
                  onClick={() => onToggleFree?.(quiz)}
                >
                  {isBusy ? (
                    <Loader2 className="size-3.5 animate-spin" />
                  ) : quiz.is_free ? (
                    <>
                      <Crown className="size-3.5" />
                      تحويل لـ Pro
                    </>
                  ) : (
                    <>
                      <Sparkles className="size-3.5" />
                      تحويل لمجاني
                    </>
                  )}
                </Button>

                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  className="h-10 gap-1.5 px-3 text-destructive hover:bg-destructive/10 hover:text-destructive"
                  disabled={pending}
                  onClick={() => onSoftDelete?.(quiz)}
                  {...spekit(SPEKIT.quizDeleteAction)}
                >
                  {isBusy ? (
                    <Loader2 className="size-3.5 animate-spin" />
                  ) : (
                    <Trash2 className="size-3.5" />
                  )}
                  حذف
                </Button>

                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="h-10 gap-1.5 px-3"
                  disabled={pending}
                  title="تعيين المجموعات"
                  onClick={() => onAssignGroups?.(quiz)}
                  {...spekit(SPEKIT.quizAssignGroupAction)}
                >
                  <Users className="size-3.5" />
                  مجموعة
                </Button>

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
              </>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
