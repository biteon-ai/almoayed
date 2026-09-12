"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import type { Question } from "@/types/database";
import { BulkQuestionUpload } from "@/components/teacher/BulkQuestionUpload";
import { QuizQuestionsManager } from "@/components/teacher/QuizQuestionsManager";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button-variants";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SPEKIT, spekit } from "@/lib/spekit-targets";
import { teacherQuizHref } from "@/lib/teacher-quiz-path";
import { cn } from "@/lib/utils";
import {
  ArrowRight,
  CheckCircle2,
  ListChecks,
  UploadCloud,
} from "lucide-react";

type DashboardTab = "questions" | "import";

interface QuizQuestionsDashboardProps {
  quizId: string;
  quizSlug: string;
  quizTitle: string;
  questions: Question[];
}

export function QuizQuestionsDashboard({
  quizId,
  quizSlug,
  quizTitle,
  questions,
}: QuizQuestionsDashboardProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isSetup = searchParams.get("setup") === "import";

  const initialTab = useMemo<DashboardTab>(
    () => (isSetup ? "import" : "questions"),
    [isSetup]
  );
  const [tab, setTab] = useState<DashboardTab>(initialTab);

  const finishSetup = () => {
    router.replace(teacherQuizHref(quizSlug));
    setTab("questions");
  };

  const handleImportSuccess = (count: number) => {
    router.replace(
      teacherQuizHref(quizSlug, { query: { imported: String(count) } })
    );
    router.refresh();
    setTab("questions");
  };

  return (
    <div className="space-y-5" dir="rtl">
      {isSetup ? (
        <div
          className="flex items-start gap-3 rounded-xl border border-emerald-200/60 bg-emerald-50/50 p-4 text-start dark:border-emerald-900/40 dark:bg-emerald-950/20"
          {...spekit(SPEKIT.quizSetupImportBanner)}
        >
          <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-emerald-600" />
          <div>
            <p className="text-sm font-bold text-emerald-900 dark:text-emerald-100">
              تم إنشاء «{quizTitle}»
            </p>
            <p className="mt-1 text-xs text-emerald-800/80 dark:text-emerald-200/80">
              الخطوة ٢ — راجع الأسئلة أو ارفع ملفاً أو أضف سؤالاً يدوياً.
            </p>
          </div>
        </div>
      ) : null}

      <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-start gap-3">
          <Link
            href="/teacher/quizzes"
            className={cn(
              buttonVariants({ variant: "ghost", size: "icon" }),
              "mt-0.5 size-10 shrink-0 rounded-xl"
            )}
            aria-label="العودة لقائمة الاختبارات"
          >
            <ArrowRight className="size-5" />
          </Link>
          <div className="min-w-0 space-y-1 text-start">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-lg font-bold tracking-tight text-foreground md:text-xl">
                إدارة أسئلة الاختبار
              </h1>
              <Badge
                variant="secondary"
                className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 hover:bg-emerald-50 dark:bg-emerald-950/50 dark:text-emerald-300"
              >
                {questions.length} سؤال
              </Badge>
            </div>
            <p className="truncate text-sm text-muted-foreground">{quizTitle}</p>
          </div>
        </div>
      </header>

      <Card className="overflow-hidden border-border/70 shadow-sm">
        <CardContent className="p-4 sm:p-6">
          <Tabs
            value={tab}
            onValueChange={(value) => {
              if (value === "questions" || value === "import") {
                setTab(value);
              }
            }}
            className="gap-5"
          >
            <TabsList className="grid h-auto w-full grid-cols-2 gap-1 p-1">
              <TabsTrigger
                value="questions"
                className="gap-1.5 px-2 py-2.5 text-xs sm:text-sm"
              >
                <ListChecks className="size-3.5 shrink-0" />
                أسئلة الاختبار
              </TabsTrigger>
              <TabsTrigger
                value="import"
                className="gap-1.5 px-2 py-2.5 text-xs sm:text-sm"
              >
                <UploadCloud className="size-3.5 shrink-0" />
                استيراد أسئلة بالجملة
              </TabsTrigger>
            </TabsList>

            <TabsContent value="questions" keepMounted className="outline-none">
              <QuizQuestionsManager
                quizId={quizId}
                questions={questions}
                onRequestImport={() => setTab("import")}
              />
            </TabsContent>

            <TabsContent value="import" keepMounted className="outline-none">
              <BulkQuestionUpload
                quizId={quizId}
                onSuccess={handleImportSuccess}
                onSkip={isSetup ? finishSetup : undefined}
              />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
