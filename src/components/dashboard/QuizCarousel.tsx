import type { QuizCarouselItem } from "@/types/database";
import { QuizCarouselCard } from "@/components/dashboard/QuizCarouselCard";
import { BookOpen, ClipboardList } from "lucide-react";
import { SPEKIT } from "@/lib/spekit-targets";

interface QuizCarouselProps {
  quizzes: QuizCarouselItem[];
}

export function QuizCarousel({ quizzes }: QuizCarouselProps) {
  return (
    <section id="quizzes" className="scroll-mt-24" data-spekit={SPEKIT.studentQuizList}>
      <h2 className="mb-5 flex items-center gap-2 text-lg font-bold text-slate-800 md:text-xl">
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
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-2">
          {quizzes.map((quiz) => (
            <QuizCarouselCard key={quiz.id} quiz={quiz} />
          ))}
        </div>
      )}
    </section>
  );
}
