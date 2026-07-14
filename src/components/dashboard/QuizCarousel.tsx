"use client";

import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import type { QuizCarouselItem } from "@/types/database";
import { QuizCarouselCard } from "@/components/dashboard/QuizCarouselCard";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  filterQuizzesByQuery,
  getQuizQueueInitialCount,
  getQuizQueueLoadMoreStep,
  QUIZ_QUEUE_INITIAL_DESKTOP,
  QUIZ_QUEUE_MOBILE_MAX_WIDTH_PX,
  remainingQuizQueueCount,
  shouldShowQuizQueueLoadMore,
  sliceVisibleQueue,
  splitQuizExamSections,
} from "@/lib/quiz-exam-list";
import { BookOpen, ChevronDown, ClipboardList, Loader2, Search } from "lucide-react";
import { SPEKIT } from "@/lib/spekit-targets";

interface QuizCarouselProps {
  quizzes: QuizCarouselItem[];
}

const MOBILE_MEDIA_QUERY = `(max-width: ${QUIZ_QUEUE_MOBILE_MAX_WIDTH_PX}px)`;

function subscribeMobileMatch(callback: () => void) {
  const mq = window.matchMedia(MOBILE_MEDIA_QUERY);
  mq.addEventListener("change", callback);
  return () => mq.removeEventListener("change", callback);
}

function getMobileMatchSnapshot() {
  return window.matchMedia(MOBILE_MEDIA_QUERY).matches;
}

function getMobileMatchServerSnapshot() {
  return false;
}

function useIsMobileViewport() {
  return useSyncExternalStore(
    subscribeMobileMatch,
    getMobileMatchSnapshot,
    getMobileMatchServerSnapshot
  );
}

export function QuizCarousel({ quizzes }: QuizCarouselProps) {
  const isMobile = useIsMobileViewport();
  const [query, setQuery] = useState("");
  const [visibleCount, setVisibleCount] = useState(QUIZ_QUEUE_INITIAL_DESKTOP);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  const { continueQuiz, queueQuizzes } = useMemo(
    () => splitQuizExamSections(quizzes),
    [quizzes]
  );

  const filteredQueue = useMemo(
    () => filterQuizzesByQuery(queueQuizzes, query),
    [queueQuizzes, query]
  );

  const isSearching = query.trim().length > 0;

  useEffect(() => {
    setVisibleCount(getQuizQueueInitialCount(isMobile));
  }, [isMobile]);

  const visibleQueue = sliceVisibleQueue(filteredQueue, visibleCount, isSearching);
  const hasMore = shouldShowQuizQueueLoadMore(
    filteredQueue,
    visibleCount,
    isSearching
  );
  const remainingCount = remainingQuizQueueCount(filteredQueue, visibleCount);

  const handleSearchChange = (value: string) => {
    setQuery(value);
    if (!value.trim()) {
      setVisibleCount(getQuizQueueInitialCount(isMobile));
    }
  };

  const handleLoadMore = () => {
    setIsLoadingMore(true);
    window.requestAnimationFrame(() => {
      setVisibleCount((count) => count + getQuizQueueLoadMoreStep(isMobile));
      setIsLoadingMore(false);
    });
  };

  return (
    <section
      id="quizzes"
      className="scroll-mt-24 space-y-8"
      data-spekit={SPEKIT.studentQuizList}
    >
      <h2 className="flex items-center gap-2 text-lg font-bold text-slate-800 md:text-xl">
        <BookOpen className="size-5 text-brand-600" />
        الاختبارات المتاحة
      </h2>

      {quizzes.length === 0 ? (
        <div
          className="flex min-h-[220px] flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50/60 px-6 py-12 text-center"
          data-spekit={SPEKIT.studentQuizEmpty}
        >
          <div className="mb-4 flex size-16 items-center justify-center rounded-full bg-white shadow-sm ring-1 ring-slate-100">
            <ClipboardList className="size-8 text-slate-400" />
          </div>
          <p className="text-base font-semibold text-slate-700">
            لا توجد اختبارات متاحة حالياً
          </p>
          <p className="mt-2 max-w-sm text-sm text-slate-500">
            راجع أستاذك قريباً — الاختبارات الجديدة رح تظهر هون فوراً.
          </p>
        </div>
      ) : (
        <>
          {continueQuiz && (
            <div className="space-y-4">
              <h3 className="text-base font-bold text-slate-800 md:text-lg">
                تابع من حيث توقفت
              </h3>
              <div className="max-w-2xl">
                <QuizCarouselCard quiz={continueQuiz} variant="featured" />
              </div>
            </div>
          )}

          <div className="space-y-5">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <h3 className="text-base font-bold text-slate-800 md:text-lg">
                جميع الاختبارات المتاحة
                <span className="ms-2 text-sm font-medium text-slate-500">
                  ({queueQuizzes.length})
                </span>
              </h3>

              {queueQuizzes.length > 0 && (
                <div className="relative w-full sm:max-w-xs">
                  <Search
                    className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-slate-400"
                    aria-hidden
                  />
                  <Input
                    type="search"
                    value={query}
                    onChange={(e) => handleSearchChange(e.target.value)}
                    placeholder="ابحث عن اختبار..."
                    className="h-11 bg-white ps-10 text-sm"
                    aria-label="بحث في الاختبارات"
                  />
                </div>
              )}
            </div>

            {filteredQueue.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/50 px-6 py-10 text-center">
                <p className="text-sm font-semibold text-slate-700">
                  ما في نتائج مطابقة لبحثك
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  جرّب كلمة مختلفة أو امسح البحث لعرض كل الاختبارات.
                </p>
              </div>
            ) : (
              <>
                <div
                  className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-2"
                  aria-busy={isLoadingMore}
                >
                  {visibleQueue.map((quiz) => (
                    <QuizCarouselCard key={quiz.id} quiz={quiz} />
                  ))}
                </div>

                {hasMore && (
                  <div className="flex justify-center pt-2">
                    <Button
                      type="button"
                      variant="outline"
                      disabled={isLoadingMore}
                      className="rounded-xl border border-slate-200 bg-white px-6 py-2.5 font-medium text-slate-700 transition-all hover:border-slate-300 hover:bg-slate-50 disabled:opacity-70"
                      onClick={handleLoadMore}
                    >
                      {isLoadingMore ? (
                        <>
                          <Loader2 className="size-4 animate-spin" aria-hidden />
                          جاري التحميل...
                        </>
                      ) : (
                        <>
                          عرض المزيد
                          <ChevronDown className="size-4" aria-hidden />
                          <span className="text-xs font-normal text-slate-500">
                            ({remainingCount} متبقية)
                          </span>
                        </>
                      )}
                    </Button>
                  </div>
                )}

                {isSearching && filteredQueue.length > 0 && (
                  <p className="text-center text-xs text-slate-500">
                    عرض {filteredQueue.length} نتيجة مطابقة للبحث
                  </p>
                )}
              </>
            )}
          </div>
        </>
      )}
    </section>
  );
}
