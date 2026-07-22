"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toggleQuizStatus, updateQuizFlags } from "@/actions/teacher";
import type { TeacherQuiz } from "@/types/database";
import { QuizListItem } from "@/components/teacher/QuizListItem";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  paginateQuizzes,
  QUIZ_PAGE_SIZE,
} from "@/lib/paginate-students";
import { SPEKIT } from "@/lib/spekit-targets";
import { cn } from "@/lib/utils";
import {
  ChevronLeft,
  ChevronRight,
  FileQuestion,
  Loader2,
  Plus,
  RotateCcw,
  Search,
  SearchX,
} from "lucide-react";

const FILTER_ALL = "all";

const TIER_LABELS: Record<string, string> = {
  all: "الكل",
  free: "مجاني",
  pro: "Pro",
};

const STATUS_LABELS: Record<string, string> = {
  all: "جميع الحالات",
  active: "نشط",
  inactive: "مخفي / غير نشط",
};

interface QuizManagementProps {
  quizzes: TeacherQuiz[];
}

export function QuizManagement({ quizzes: initial }: QuizManagementProps) {
  const router = useRouter();
  const [quizzes, setQuizzes] = useState(initial);
  const [search, setSearch] = useState("");
  const [filterTier, setFilterTier] = useState<"all" | "free" | "pro">("all");
  const [filterStatus, setFilterStatus] = useState<
    "all" | "active" | "inactive"
  >("all");
  const [page, setPage] = useState(1);
  const [pending, startTransition] = useTransition();
  const [confirmQuiz, setConfirmQuiz] = useState<TeacherQuiz | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  useEffect(() => {
    setQuizzes(initial);
  }, [initial]);

  const resetPage = () => setPage(1);

  const hasActiveFilters =
    search.trim().length > 0 ||
    filterTier !== FILTER_ALL ||
    filterStatus !== FILTER_ALL;

  const resetFilters = () => {
    setSearch("");
    setFilterTier("all");
    setFilterStatus("all");
    setPage(1);
  };

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return quizzes.filter((quiz) => {
      if (q && !quiz.title.toLowerCase().includes(q)) return false;
      if (filterTier === "free" && !quiz.is_free) return false;
      if (filterTier === "pro" && quiz.is_free) return false;
      if (filterStatus === "active" && !quiz.is_active) return false;
      if (filterStatus === "inactive" && quiz.is_active) return false;
      return true;
    });
  }, [quizzes, search, filterTier, filterStatus]);

  const { items, page: safePage, totalPages, total } = paginateQuizzes(
    filtered,
    page
  );

  useEffect(() => {
    if (page !== safePage) setPage(safePage);
  }, [page, safePage]);

  const rangeStart = total === 0 ? 0 : (safePage - 1) * QUIZ_PAGE_SIZE + 1;
  const rangeEnd = Math.min(safePage * QUIZ_PAGE_SIZE, total);

  const patchQuiz = (id: string, patch: Partial<TeacherQuiz>) => {
    setQuizzes((prev) =>
      prev.map((q) => (q.id === id ? { ...q, ...patch } : q))
    );
  };

  const confirmToggleLabel = confirmQuiz?.is_active ? "إخفاء" : "تفعيل";

  return (
    <div className="mx-auto w-full max-w-6xl space-y-5" dir="rtl">
      <div className="text-start">
        <h1 className="text-xl font-bold tracking-tight">إدارة الاختبارات</h1>
        <p className="text-sm text-muted-foreground">
          بحث، تصفية، وتفعيل اختباراتك من مكان واحد
        </p>
      </div>

      <div className="space-y-3 rounded-xl border border-border bg-card p-4 shadow-sm">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative min-w-0 flex-1">
            <Search className="pointer-events-none absolute top-1/2 start-3 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                resetPage();
              }}
              placeholder="بحث باسم الاختبار..."
              className="h-10 rounded-lg border-input bg-background pe-3 ps-9 text-sm text-start"
            />
          </div>
          <Link
            href="/teacher/quizzes/new"
            className={cn(
              buttonVariants({ variant: "brand" }),
              "h-10 w-full shrink-0 gap-1.5 sm:w-auto"
            )}
            data-spekit={SPEKIT.teacherQuizNewButton}
          >
            <Plus className="size-4" />
            اختبار جديد
          </Link>
        </div>

        <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">
              المستوى
            </label>
            <Select
              value={filterTier}
              items={TIER_LABELS}
              onValueChange={(value) => {
                if (!value || typeof value !== "string") return;
                setFilterTier(value as "all" | "free" | "pro");
                resetPage();
              }}
            >
              <SelectTrigger className="h-10 w-full min-w-0 rounded-lg bg-background text-start shadow-none">
                <SelectValue placeholder={TIER_LABELS.all}>
                  {TIER_LABELS[filterTier] ?? TIER_LABELS.all}
                </SelectValue>
              </SelectTrigger>
              <SelectContent align="start">
                <SelectItem value="all">{TIER_LABELS.all}</SelectItem>
                <SelectItem value="free">{TIER_LABELS.free}</SelectItem>
                <SelectItem value="pro">{TIER_LABELS.pro}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">
              الحالة
            </label>
            <Select
              value={filterStatus}
              items={STATUS_LABELS}
              onValueChange={(value) => {
                if (!value || typeof value !== "string") return;
                setFilterStatus(value as "all" | "active" | "inactive");
                resetPage();
              }}
            >
              <SelectTrigger className="h-10 w-full min-w-0 rounded-lg bg-background text-start shadow-none">
                <SelectValue placeholder={STATUS_LABELS.all}>
                  {STATUS_LABELS[filterStatus] ?? STATUS_LABELS.all}
                </SelectValue>
              </SelectTrigger>
              <SelectContent align="start">
                <SelectItem value="all">{STATUS_LABELS.all}</SelectItem>
                <SelectItem value="active">{STATUS_LABELS.active}</SelectItem>
                <SelectItem value="inactive">
                  {STATUS_LABELS.inactive}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {hasActiveFilters && (
          <div className="flex flex-wrap items-center gap-2 border-t border-border/50 pt-3">
            <span className="text-xs font-medium text-muted-foreground">
              التصفية النشطة:
            </span>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-8 gap-1.5 border-destructive/30 text-destructive hover:bg-destructive/10 hover:text-destructive"
              onClick={resetFilters}
            >
              <RotateCcw className="size-3.5" />
              إعادة ضبط التصفية
            </Button>
          </div>
        )}
      </div>

      {actionError && (
        <p
          role="alert"
          className="rounded-xl border border-destructive/25 bg-destructive/5 px-4 py-3 text-sm font-semibold text-destructive"
        >
          {actionError}
        </p>
      )}

      <div className="space-y-3">
        {items.map((quiz) => (
          <QuizListItem
            key={quiz.id}
            quiz={quiz}
            pending={pending}
            onRequestToggleActive={(q) => {
              setActionError(null);
              setConfirmQuiz(q);
            }}
            onToggleFree={(q) => {
              setActionError(null);
              startTransition(async () => {
                try {
                  await updateQuizFlags(q.id, { is_free: !q.is_free });
                  patchQuiz(q.id, { is_free: !q.is_free });
                  router.refresh();
                } catch (cause) {
                  setActionError(
                    cause instanceof Error
                      ? cause.message
                      : "فشل تحديث المستوى."
                  );
                }
              });
            }}
          />
        ))}

        {total === 0 && (
          <Card className="rounded-xl border bg-card">
            <CardContent className="flex flex-col items-center gap-3 p-10 text-center">
              {hasActiveFilters ? (
                <SearchX className="size-10 text-muted-foreground" />
              ) : (
                <FileQuestion className="size-10 text-muted-foreground" />
              )}
              <p className="text-sm font-medium text-foreground">
                {hasActiveFilters
                  ? "لا توجد اختبارات تطابق البحث"
                  : "ما في اختبارات بعد. أنشئ أول اختبار!"}
              </p>
              {hasActiveFilters ? (
                <Button
                  type="button"
                  variant="outline"
                  className="h-10 gap-1.5"
                  onClick={resetFilters}
                >
                  <RotateCcw className="size-3.5" />
                  إعادة ضبط التصفية
                </Button>
              ) : (
                <Link
                  href="/teacher/quizzes/new"
                  className={cn(
                    buttonVariants({ variant: "brand" }),
                    "h-10 gap-1.5"
                  )}
                >
                  <Plus className="size-4" />
                  اختبار جديد
                </Link>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      {total > 0 && (
        <div className="flex flex-col gap-3 rounded-xl border border-border/70 bg-card px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-muted-foreground">
            عرض {rangeStart}-{rangeEnd} من أصل {total} اختبار
            <span className="mx-2 text-border">·</span>
            صفحة {safePage} من {totalPages}
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              className="h-10 gap-1.5"
              disabled={safePage <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              <ChevronRight className="size-4" />
              السابق
            </Button>
            <Button
              variant="outline"
              className="h-10 gap-1.5"
              disabled={safePage >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            >
              التالي
              <ChevronLeft className="size-4" />
            </Button>
          </div>
        </div>
      )}

      <AlertDialog
        open={!!confirmQuiz}
        onOpenChange={(open) => {
          if (!open) setConfirmQuiz(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>تأكيد تغيير حالة الاختبار</AlertDialogTitle>
            <AlertDialogDescription>
              هل أنت متأكد من {confirmToggleLabel} اختبار «
              {confirmQuiz?.title}»؟
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (!confirmQuiz) return;
                const quiz = confirmQuiz;
                const nextActive = !quiz.is_active;
                setConfirmQuiz(null);
                startTransition(async () => {
                  const result = await toggleQuizStatus(quiz.id, nextActive);
                  if (!result.ok) {
                    setActionError(result.error);
                    return;
                  }
                  patchQuiz(quiz.id, { is_active: nextActive });
                  setActionError(null);
                  router.refresh();
                });
              }}
              className="inline-flex gap-2"
            >
              {pending ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  جاري التحديث...
                </>
              ) : (
                "تأكيد"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
