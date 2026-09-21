"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Bookmark, CloudOff, Loader2 } from "lucide-react";
import { idbGetAll, OFFLINE_STORES } from "@/lib/offline/db";
import { listQuizPackages } from "@/lib/offline/quiz-cache";
import type { InProgressRecord, PendingSubmissionRecord, QuizPackageRecord } from "@/lib/offline/types";
import { SPEKIT } from "@/lib/spekit-targets";
import { cn } from "@/lib/utils";

export function OfflineSavedQuizzesList({
  teacherId,
  onOpenQuiz,
}: {
  teacherId: string | null;
  onOpenQuiz?: () => void;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [packages, setPackages] = useState<QuizPackageRecord[]>([]);
  const [inProgressIds, setInProgressIds] = useState<Set<string>>(new Set());
  const [pendingIds, setPendingIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    let cancelled = false;

    async function load() {
      if (!teacherId) {
        setPackages([]);
        setLoading(false);
        return;
      }

      try {
        const [rows, inProgress, pending] = await Promise.all([
          listQuizPackages({ teacherId }),
          idbGetAll<InProgressRecord>(OFFLINE_STORES.inProgress),
          idbGetAll<PendingSubmissionRecord>(OFFLINE_STORES.pendingSubmissions),
        ]);
        if (cancelled) return;
        setPackages(rows);
        setInProgressIds(new Set(inProgress.map((row) => row.quizId)));
        setPendingIds(new Set(pending.map((row) => row.quizId)));
      } catch {
        if (!cancelled) setPackages([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [teacherId]);

  const openQuiz = useCallback(
    (quizId: string) => {
      onOpenQuiz?.();
      router.push(`/quiz/${quizId}`);
    },
    [onOpenQuiz, router]
  );

  if (!teacherId) {
    return (
      <p className="px-1 text-xs leading-relaxed text-muted-foreground">
        سجّل الدخول لعرض المحفوظات
      </p>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center gap-2 px-1 text-xs text-muted-foreground">
        <Loader2 className="size-3.5 animate-spin" aria-hidden />
        جاري التحميل…
      </div>
    );
  }

  if (packages.length === 0) {
    return (
      <p className="px-1 text-xs leading-relaxed text-muted-foreground">
        ما في اختبارات محفوظة على هذا الجهاز. افتح اختباراً وأنت متصل ليظهر هنا.
      </p>
    );
  }

  return (
    <ul className="space-y-2" data-spekit={SPEKIT.nativeOfflineList}>
      {packages.map((row) => {
        const title = row.quiz.title?.trim() || "اختبار محفوظ";
        return (
          <li key={row.quizId}>
            <button
              type="button"
              onClick={() => openQuiz(row.quizId)}
              className={cn(
                "flex min-h-12 w-full items-center gap-3 rounded-xl border border-border/70",
                "bg-muted/30 px-3 py-2 text-start transition-colors hover:bg-muted/60"
              )}
            >
              <Bookmark className="size-4 shrink-0 text-brand-600" aria-hidden />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-bold text-foreground">
                  {title}
                </span>
                <span className="mt-0.5 flex flex-wrap gap-1 text-[10px] font-semibold text-muted-foreground">
                  {inProgressIds.has(row.quizId) ? (
                    <span className="rounded-full bg-amber-500/15 px-1.5 py-0.5 text-amber-800 dark:text-amber-200">
                      متابعة
                    </span>
                  ) : null}
                  {pendingIds.has(row.quizId) ? (
                    <span className="inline-flex items-center gap-0.5 rounded-full bg-sky-500/15 px-1.5 py-0.5 text-sky-800 dark:text-sky-200">
                      <CloudOff className="size-3" aria-hidden />
                      بانتظار المزامنة
                    </span>
                  ) : null}
                </span>
              </span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}
