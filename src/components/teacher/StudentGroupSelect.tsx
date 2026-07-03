"use client";

import { useTransition } from "react";
import { assignStudentToGroup } from "@/actions/teacher";
import type { TeacherGroup } from "@/types/database";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { UsersRound } from "lucide-react";

interface StudentGroupSelectProps {
  studentId: string;
  groups: TeacherGroup[];
  disabled?: boolean;
}

export function StudentGroupSelect({
  studentId,
  groups,
  disabled,
}: StudentGroupSelectProps) {
  const [pending, startTransition] = useTransition();

  return (
    <Select
      disabled={disabled || pending}
      onValueChange={(value) => {
        if (!value || typeof value !== "string") return;
        startTransition(() => assignStudentToGroup(value, studentId));
      }}
    >
      <SelectTrigger
        size="sm"
        className="h-9 w-full min-w-[10rem] max-w-xs bg-muted/40 px-3 text-start shadow-none"
      >
        <UsersRound className="size-3.5 shrink-0 text-muted-foreground" />
        <SelectValue placeholder="اختار مجموعة..." className="text-start" />
      </SelectTrigger>
      <SelectContent align="start" className="min-w-[var(--anchor-width)]">
        {groups.map((group) => (
          <SelectItem key={group.id} value={group.id}>
            {group.group_name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
