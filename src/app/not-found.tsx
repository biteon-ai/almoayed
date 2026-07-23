"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button"
import { buttonVariants } from "@/components/ui/button-variants";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Home, BookOpen, ArrowRight, Sparkles, HelpCircle } from "lucide-react";

export default function NotFound() {
  const router = useRouter();

  return (
    <div className="relative flex min-h-dvh w-full items-center justify-center overflow-hidden bg-background p-4 sm:p-6">
      <div className="pointer-events-none absolute -right-20 top-1/4 h-80 w-80 rounded-full bg-emerald-500/10 blur-3xl" />
      <div className="pointer-events-none absolute -left-20 bottom-1/4 h-80 w-80 rounded-full bg-teal-500/10 blur-3xl" />

      <div className="relative z-10 w-full max-w-xl space-y-6 text-center">
        <div className="relative inline-block">
          <span className="select-none text-8xl font-black tracking-widest text-emerald-600/10 dark:text-emerald-400/10 sm:text-9xl">
            404
          </span>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="flex h-20 w-20 rotate-6 items-center justify-center rounded-3xl border border-emerald-500/20 bg-emerald-500/10 shadow-inner backdrop-blur-md transition-transform duration-300 hover:rotate-0 sm:h-24 sm:w-24">
              <HelpCircle className="h-10 w-10 text-emerald-600 dark:text-emerald-400 sm:h-12 sm:w-12" />
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex justify-center">
            <Badge className="gap-1.5 rounded-full border-emerald-200/60 bg-emerald-500/15 px-3 py-1 text-xs text-emerald-700 dark:text-emerald-300">
              <Sparkles className="h-3.5 w-3.5 text-amber-500" />
              <span>خطأ في العنوان</span>
            </Badge>
          </div>

          <h1 className="text-2xl font-black tracking-tight text-foreground sm:text-4xl">
            الصفحة التي تبحث عنها غير موجودة!
          </h1>
          <p className="mx-auto max-w-md text-sm leading-relaxed text-muted-foreground sm:text-base">
            يبدو أنك سلكت مساراً غير صحيح أو تم نقل الصفحة. لا تقلق، يمكنك
            العودة لمواصلة تعلمك واختباراتك!
          </p>
        </div>

        <div className="flex flex-col items-center justify-center gap-3 pt-2 sm:flex-row">
          <Link
            href="/"
            className={cn(
              buttonVariants({ size: "lg" }),
              "h-11 w-full gap-2 rounded-xl bg-emerald-600 px-6 text-xs font-bold text-white shadow-md hover:bg-emerald-700 sm:w-auto sm:text-sm"
            )}
          >
            <Home className="h-4 w-4" />
            <span>العودة للرئيسية</span>
          </Link>

          <Link
            href="/quizzes"
            className={cn(
              buttonVariants({ variant: "outline", size: "lg" }),
              "h-11 w-full gap-2 rounded-xl border-emerald-200 px-6 text-xs font-bold text-emerald-700 hover:bg-emerald-50 sm:w-auto sm:text-sm"
            )}
          >
            <BookOpen className="h-4 w-4 text-emerald-600" />
            <span>استكشف الاختبارات</span>
          </Link>

          <Button
            type="button"
            variant="ghost"
            onClick={() => router.back()}
            className="h-11 w-full gap-1.5 rounded-xl px-4 text-xs text-muted-foreground hover:text-foreground sm:w-auto sm:text-sm"
          >
            <ArrowRight className="h-4 w-4" />
            <span>الصفحة السابقة</span>
          </Button>
        </div>
      </div>
    </div>
  );
}
