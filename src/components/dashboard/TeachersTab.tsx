import { TeacherSwitcher } from "@/components/dashboard/TeacherSwitcher";
import type { StudentTeacherOption } from "@/types/database";
import { GraduationCap } from "lucide-react";

interface TeachersTabProps {
  teachers: StudentTeacherOption[];
  currentTeacherId: string | null;
}

export function TeachersTab({ teachers, currentTeacherId }: TeachersTabProps) {
  if (teachers.length === 0) {
    return (
      <div className="flex flex-col items-center py-10 text-center">
        <GraduationCap className="mb-3 size-8 text-slate-300" />
        <p className="text-sm text-slate-500">
          ما في أستاذ مرتبط بحسابك حالياً.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-4 md:bg-transparent md:p-0">
      <TeacherSwitcher
        teachers={teachers}
        currentTeacherId={currentTeacherId}
      />
    </div>
  );
}
