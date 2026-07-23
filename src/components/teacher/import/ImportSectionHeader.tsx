"use client";

import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ArrowRight } from "lucide-react";
import type { MouseEvent } from "react";

interface ImportSectionHeaderProps {
  quizTitle: string;
  /** Prefer `/teacher/quizzes/{id}#quiz-questions` for «العودة للاختبار». */
  backHref?: string;
  backLabel?: string;
}

/** Same-page hash links need an explicit scroll — Next.js soft-nav is a no-op on identical paths. */
function handleBackClick(event: MouseEvent<HTMLAnchorElement>, href: string) {
  const hashIndex = href.indexOf("#");
  if (hashIndex === -1 || typeof window === "undefined") return;

  const path = href.slice(0, hashIndex) || window.location.pathname;
  const hash = href.slice(hashIndex + 1);
  if (window.location.pathname !== path) return;

  const target = document.getElementById(hash);
  if (!target) return;

  event.preventDefault();
  target.scrollIntoView({ behavior: "smooth", block: "start" });
  window.history.replaceState(null, "", `${path}#${hash}`);
}

export function ImportSectionHeader({
  quizTitle,
  backHref = "/teacher/quizzes",
  backLabel = "العودة للاختبار",
}: ImportSectionHeaderProps) {
  return (
    <header
      dir="rtl"
      className="mb-6 flex flex-col gap-4 border-b border-border/60 pb-5 sm:flex-row sm:items-start sm:justify-between"
    >
      <div className="min-w-0 space-y-2.5 text-start">
        <h2 className="text-xl font-bold tracking-tight text-foreground md:text-2xl">
          استيراد وتنسيق الأسئلة
        </h2>
        <Badge
          variant="secondary"
          className="max-w-full truncate rounded-full bg-brand-50 px-3 py-1 text-sm font-medium text-brand-800 hover:bg-brand-50 dark:bg-brand-950/40 dark:text-brand-200"
        >
          الاختبار: {quizTitle}
        </Badge>
      </div>

      <Link
        href={backHref}
        onClick={(event) => handleBackClick(event, backHref)}
        className={cn(
          buttonVariants({ variant: "outline" }),
          "h-10 shrink-0 gap-2 self-start rounded-xl text-sm font-medium sm:self-center"
        )}
      >
        <ArrowRight className="size-4" aria-hidden />
        <span>{backLabel}</span>
      </Link>
    </header>
  );
}
