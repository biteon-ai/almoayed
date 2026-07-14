import Link from "next/link";
import { ChevronLeft } from "lucide-react";

interface ImportSectionHeaderProps {
  quizTitle: string;
  backHref?: string;
}

export function ImportSectionHeader({
  quizTitle,
  backHref = "/teacher/quizzes",
}: ImportSectionHeaderProps) {
  return (
    <div className="mb-6 flex flex-col gap-4 border-b border-slate-100 pb-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex min-w-0 flex-wrap items-center gap-3">
        <h2 className="text-xl font-bold text-slate-800 md:text-2xl">
          استيراد أسئلة بالجملة
        </h2>
        <span className="rounded-full bg-teal-50 px-3 py-1 text-sm font-medium text-teal-700">
          الاختبار: {quizTitle}
        </span>
      </div>
      <Link
        href={backHref}
        className="flex shrink-0 items-center gap-2 self-start text-slate-500 transition-colors hover:text-slate-800 sm:self-center"
      >
        <span className="text-sm font-medium">رجوع</span>
        <ChevronLeft className="size-4" aria-hidden />
      </Link>
    </div>
  );
}
