"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { BulkQuestionUpload } from "@/components/teacher/BulkQuestionUpload";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { CheckCircle2 } from "lucide-react";
import { SPEKIT, spekit } from "@/lib/spekit-targets";

interface EditQuizBulkImportSectionProps {
  quizId: string;
  quizTitle: string;
}

export function EditQuizBulkImportSection({
  quizId,
  quizTitle,
}: EditQuizBulkImportSectionProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isSetup = searchParams.get("setup") === "import";

  const finishSetup = () => {
    router.replace(`/teacher/quizzes/${quizId}`);
  };

  const handleSuccess = (count: number) => {
    router.replace(`/teacher/quizzes/${quizId}?imported=${count}`);
    router.refresh();
  };

  return (
    <div className="space-y-4">
      {isSetup && (
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
              الخطوة ٢ — ارفع ملف الأسئلة أو تخطّى للإضافة اليدوية.
            </p>
          </div>
        </div>
      )}

      <Card className="overflow-hidden border-border/70 shadow-sm">
        <CardHeader className="space-y-1 p-6 pb-4 text-start">
          <CardTitle className="text-base font-semibold">
            استيراد أسئلة بالجملة
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6 pt-0">
          <BulkQuestionUpload
            quizId={quizId}
            onSuccess={handleSuccess}
            onSkip={isSetup ? finishSetup : undefined}
          />
        </CardContent>
      </Card>
    </div>
  );
}
