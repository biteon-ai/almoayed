"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { ImportSuccessToast } from "@/components/teacher/BulkQuestionUpload";

export function EditQuizImportToast() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const importedRaw = searchParams.get("imported");
  const count = importedRaw ? Number.parseInt(importedRaw, 10) : 0;

  if (!count || Number.isNaN(count)) {
    return null;
  }

  const dismiss = () => {
    router.replace(window.location.pathname);
  };

  return <ImportSuccessToast importedCount={count} onDismiss={dismiss} />;
}
