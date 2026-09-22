"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { switchTeacher } from "@/actions/student";
import { useStudentLoadingBarSync } from "@/components/layout/StudentPortalShell";
import type { StudentTeacherOption } from "@/types/database";
import { GraduationCap, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { SPEKIT, spekit } from "@/lib/spekit-targets";

interface TeacherSwitcherProps {
  teachers: StudentTeacherOption[];
  currentTeacherId: string | null;
}

export function TeacherSwitcher({
  teachers,
  currentTeacherId,
}: TeacherSwitcherProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  useStudentLoadingBarSync(pending);

  if (teachers.length <= 1) {
    const t = teachers[0];
    if (!t) return null;
    return (
      <div
        className="flex items-center gap-2 rounded-lg bg-brand-50 px-3 py-2 text-xs dark:bg-brand-950/40 dark:text-brand-100"
        {...spekit(SPEKIT.teacherSwitcher)}
      >
        <GraduationCap className="size-4 text-brand-600" />
        <span className="font-medium">{t.teacherName}</span>
        {t.schoolName && (
          <span className="text-muted-foreground">— {t.schoolName}</span>
        )}
      </div>
    );
  }

  return (
    <div className="relative" {...spekit(SPEKIT.teacherSwitcher)}>
      <label className="mb-1 block text-xs text-muted-foreground">
        الأستاذ الحالي
      </label>
      <div className="relative">
        <GraduationCap className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-brand-600" />
        <select
          className={cn(
            "h-10 w-full appearance-none rounded-lg border border-border bg-white pe-8 ps-10 text-sm font-medium text-foreground",
            "dark:border-slate-600 dark:bg-slate-900 dark:text-white",
            pending && "opacity-60"
          )}
          value={currentTeacherId ?? teachers[0]?.teacherId ?? ""}
          disabled={pending}
          onChange={(e) => {
            startTransition(async () => {
              await switchTeacher(e.target.value);
              router.refresh();
            });
          }}
        >
          {teachers.map((t) => (
            <option key={t.teacherId} value={t.teacherId}>
              {t.teacherName}
              {t.schoolName ? ` — ${t.schoolName}` : ""}
            </option>
          ))}
        </select>
        <ChevronDown className="pointer-events-none absolute end-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
      </div>
    </div>
  );
}
