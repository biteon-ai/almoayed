"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState, useTransition } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import {
  permanentlyDeleteQuiz,
  restoreQuiz,
  softDeleteQuiz,
  toggleQuizStatus,
  updateQuizFlags,
  type QuizListView,
} from "@/actions/teacher";
import type { TeacherQuiz } from "@/types/database";
import type { PagedResult } from "@/lib/pagination-server";
import { QuizListItem } from "@/components/teacher/QuizListItem";
import { AssignGroupModal } from "@/components/teacher/AssignGroupModal";
import { QuizMetricsKPIHeader } from "@/components/teacher/QuizMetricsKPIHeader";
import { PaginationControls } from "@/components/ui/pagination-controls";
import { Button } from "@/components/ui/button";
import { buttonVariants } from "@/components/ui/button-variants";
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
import { SPEKIT } from "@/lib/spekit-targets";
import { cn } from "@/lib/utils";
import {
  FileQuestion,
  Loader2,
  Plus,
  RotateCcw,
  Search,
  SearchX,
  Trash2,
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
  quizzesPage: PagedResult<TeacherQuiz>;
  view?: QuizListView;
}

export function QuizManagement({
  quizzesPage,
  view = "active",
}: QuizManagementProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [quizzes, setQuizzes] = useState(quizzesPage.items);
  const [search, setSearch] = useState("");
  const [filterTier, setFilterTier] = useState<"all" | "free" | "pro">("all");
  const [filterStatus, setFilterStatus] = useState<
    "all" | "active" | "inactive"
  >("all");
  const [pending, startTransition] = useTransition();
  const [pendingQuizId, setPendingQuizId] = useState<string | null>(null);
  const [confirmQuiz, setConfirmQuiz] = useState<TeacherQuiz | null>(null);
  const [purgeQuiz, setPurgeQuiz] = useState<TeacherQuiz | null>(null);
  const [assignGroupQuiz, setAssignGroupQuiz] = useState<TeacherQuiz | null>(
    null
  );
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [purging, setPurging] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const isTrash = view === "trash";

  useEffect(() => {
    setQuizzes(quizzesPage.items);
  }, [quizzesPage.items]);

  const pushQuery = useCallback(
    (patch: Record<string, string | undefined>) => {
      const next = new URLSearchParams(searchParams.toString());
      for (const [key, value] of Object.entries(patch)) {
        if (
          !value ||
          value === "all" ||
          (key === "view" && value === "active")
        ) {
          next.delete(key);
        } else {
          next.set(key, value);
        }
      }
      const qs = next.toString();
      router.push(qs ? `${pathname}?${qs}` : pathname);
    },
    [pathname, router, searchParams]
  );

  const setView = (next: QuizListView) => {
    pushQuery({ view: next, page: undefined });
  };

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const rows = quizzes.filter((quiz) => {
      if (q && !quiz.title.toLowerCase().includes(q)) return false;
      if (filterTier === "free" && !quiz.is_free) return false;
      if (filterTier === "pro" && quiz.is_free) return false;
      if (filterStatus === "active" && !quiz.is_active) return false;
      if (filterStatus === "inactive" && quiz.is_active) return false;
      return true;
    });

    return [...rows].sort((a, b) => {
      if (isTrash) {
        const aDel = new Date(a.deleted_at || a.updated_at).getTime();
        const bDel = new Date(b.deleted_at || b.updated_at).getTime();
        return bDel - aDel;
      }
      const aUpdated = new Date(a.updated_at || a.created_at).getTime();
      const bUpdated = new Date(b.updated_at || b.created_at).getTime();
      if (bUpdated !== aUpdated) return bUpdated - aUpdated;
      return (
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
    });
  }, [quizzes, search, filterTier, filterStatus, isTrash]);

  const safePage = quizzesPage.page;
  const pageSize = quizzesPage.pageSize;
  const total = quizzesPage.total;
  const totalPages = Math.max(1, Math.ceil(total / pageSize) || 1);

  const setPage = (page: number) => {
    pushQuery({ page: String(page), view: isTrash ? "trash" : undefined });
  };

  const hasActiveFilters =
    search.trim().length > 0 ||
    filterTier !== FILTER_ALL ||
    filterStatus !== FILTER_ALL;

  const resetFilters = () => {
    setSearch("");
    setFilterTier("all");
    setFilterStatus("all");
    pushQuery({ page: undefined, view: isTrash ? "trash" : undefined });
  };

  const patchQuiz = (id: string, patch: Partial<TeacherQuiz>) => {
    setQuizzes((prev) =>
      prev.map((q) => (q.id === id ? { ...q, ...patch } : q))
    );
  };

  const removeQuizLocal = (id: string) => {
    setQuizzes((prev) => prev.filter((q) => q.id !== id));
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

      <div className="flex gap-2 rounded-xl border border-border bg-card p-1.5">
        <Button
          type="button"
          variant={isTrash ? "ghost" : "brand"}
          className="h-10 flex-1 gap-1.5"
          onClick={() => setView("active")}
        >
          اختباراتي
        </Button>
        <Button
          type="button"
          variant={isTrash ? "brand" : "ghost"}
          className="h-10 flex-1 gap-1.5"
          onClick={() => setView("trash")}
          data-spekit={SPEKIT.quizTrashTab}
        >
          <Trash2 className="size-4" />
          سلة المهملات
        </Button>
      </div>

      {!isTrash && (
        <QuizMetricsKPIHeader
          quizzes={quizzes}
          catalogTotal={quizzesPage.total}
        />
      )}

      <div className="space-y-3 rounded-xl border border-border bg-card p-4 shadow-sm">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative min-w-0 flex-1">
            <Search className="pointer-events-none absolute top-1/2 start-3 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
              }}
              placeholder="بحث باسم الاختبار..."
              className="h-10 rounded-lg border-input bg-background pe-3 ps-9 text-sm text-start"
            />
          </div>
          {!isTrash && (
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
          )}
        </div>

        {!isTrash && (
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
        )}

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

      {successMessage && (
        <p
          role="status"
          className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-900 dark:border-emerald-900/50 dark:bg-emerald-950/30 dark:text-emerald-100"
        >
          {successMessage}
        </p>
      )}

      {actionError && (
        <p
          role="alert"
          className="rounded-xl border border-destructive/25 bg-destructive/5 px-4 py-3 text-sm font-semibold text-destructive"
        >
          {actionError}
        </p>
      )}

      <div className="space-y-3">
        {filtered.map((quiz) => (
          <QuizListItem
            key={quiz.id}
            quiz={quiz}
            mode={isTrash ? "trash" : "active"}
            pending={pending}
            pendingQuizId={pendingQuizId}
            onRequestToggleActive={(q) => {
              setActionError(null);
              setConfirmQuiz(q);
            }}
            onToggleFree={(q) => {
              setActionError(null);
              setPendingQuizId(q.id);
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
                } finally {
                  setPendingQuizId(null);
                }
              });
            }}
            onSoftDelete={(q) => {
              setActionError(null);
              setPendingQuizId(q.id);
              startTransition(async () => {
                try {
                  const result = await softDeleteQuiz(q.id);
                  if (!result.ok) {
                    setActionError(result.error);
                    return;
                  }
                  removeQuizLocal(q.id);
                  router.refresh();
                } finally {
                  setPendingQuizId(null);
                }
              });
            }}
            onRestore={(q) => {
              setActionError(null);
              setPendingQuizId(q.id);
              startTransition(async () => {
                try {
                  const result = await restoreQuiz(q.id);
                  if (!result.ok) {
                    setActionError(result.error);
                    return;
                  }
                  removeQuizLocal(q.id);
                  router.refresh();
                } finally {
                  setPendingQuizId(null);
                }
              });
            }}
            onRequestPermanentDelete={(q) => {
              setActionError(null);
              setPurgeQuiz(q);
            }}
            onAssignGroups={(q) => {
              setActionError(null);
              setSuccessMessage(null);
              setAssignGroupQuiz(q);
            }}
          />
        ))}

        {total === 0 && (
          <Card className="rounded-xl border bg-card">
            <CardContent className="flex flex-col items-center gap-3 p-10 text-center">
              {isTrash ? (
                <>
                  <Trash2 className="size-10 text-muted-foreground" />
                  <p className="text-sm font-medium text-foreground">
                    سلة المهملات فارغة
                  </p>
                </>
              ) : (
                <>
                  <FileQuestion className="size-10 text-muted-foreground" />
                  <p className="text-sm font-medium text-foreground">
                    ما في اختبارات بعد. أنشئ أول اختبار!
                  </p>
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
                </>
              )}
            </CardContent>
          </Card>
        )}

        {total > 0 && filtered.length === 0 && (
          <Card className="rounded-xl border bg-card">
            <CardContent className="flex flex-col items-center gap-3 p-10 text-center">
              <SearchX className="size-10 text-muted-foreground" />
              <p className="text-sm font-medium text-foreground">
                لا توجد اختبارات تطابق البحث
              </p>
              <Button
                type="button"
                variant="outline"
                className="h-10 gap-1.5"
                onClick={resetFilters}
              >
                <RotateCcw className="size-3.5" />
                إعادة ضبط التصفية
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      {total > 0 && (
        <PaginationControls
          page={safePage}
          totalPages={totalPages}
          total={total}
          pageSize={pageSize}
          onPageChange={setPage}
          itemLabel="اختبار"
          variant="full"
          className="rounded-xl border border-border/70 bg-card px-4 py-3"
        />
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
                setPendingQuizId(quiz.id);
                startTransition(async () => {
                  try {
                    const result = await toggleQuizStatus(quiz.id, nextActive);
                    if (!result.ok) {
                      setActionError(result.error);
                      return;
                    }
                    patchQuiz(quiz.id, { is_active: nextActive });
                    setActionError(null);
                    router.refresh();
                  } finally {
                    setPendingQuizId(null);
                  }
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

      <AlertDialog
        open={!!purgeQuiz}
        onOpenChange={(open) => {
          if (!open && !purging) setPurgeQuiz(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>تأكيد الحذف النهائي</AlertDialogTitle>
            <AlertDialogDescription>
              هل أنت متأكد من حذف هذا الاختبار بشكل نهائي؟ لا يمكن التراجع عن
              هذا الإجراء. سيتم حذف الأسئلة وسجلات النتائج المرتبطة بـ «
              {purgeQuiz?.title}».
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (!purgeQuiz || purging) return;
                const quiz = purgeQuiz;
                setPurging(true);
                setPendingQuizId(quiz.id);
                startTransition(async () => {
                  try {
                    const result = await permanentlyDeleteQuiz(quiz.id);
                    if (!result.ok) {
                      setActionError(result.error);
                      return;
                    }
                    removeQuizLocal(quiz.id);
                    setPurgeQuiz(null);
                    setActionError(null);
                    router.refresh();
                  } finally {
                    setPurging(false);
                    setPendingQuizId(null);
                  }
                });
              }}
              className="inline-flex gap-2 bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {purging ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  جاري الحذف...
                </>
              ) : (
                "حذف نهائي"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AssignGroupModal
        quizId={assignGroupQuiz?.id ?? null}
        open={!!assignGroupQuiz}
        onOpenChange={(open) => {
          if (!open) setAssignGroupQuiz(null);
        }}
        onSuccess={(message) => {
          setSuccessMessage(message);
          setActionError(null);
          window.setTimeout(() => setSuccessMessage(null), 4000);
        }}
        onError={(message) => {
          setActionError(message);
          setSuccessMessage(null);
        }}
        onSaved={(quizId, groups) => {
          patchQuiz(quizId, {
            quiz_type: groups.length > 0 ? "session_group" : "regular",
            target_group_id: groups[0]?.id ?? null,
            assigned_groups: groups,
          });
          router.refresh();
        }}
      />
    </div>
  );
}
