"use client";

import { useMemo, useTransition } from "react";
import { setStudentGroup } from "@/actions/teacher";
import type { TeacherGroup } from "@/types/database";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { UsersRound } from "lucide-react";
import { SPEKIT, spekit } from "@/lib/spekit-targets";

const NONE = "none";

interface StudentGroupSelectProps {
  studentId: string;
  groups: TeacherGroup[];
  groupId?: string | null;
  disabled?: boolean;
  compact?: boolean;
  onChanged?: (groupId: string | null, groupName: string | null) => void;
}

export function StudentGroupSelect({
  studentId,
  groups,
  groupId = null,
  disabled,
  compact = false,
  onChanged,
}: StudentGroupSelectProps) {
  const [pending, startTransition] = useTransition();

  const items = useMemo(() => {
    const map: Record<string, string> = {
      [NONE]: "بدون مجموعة",
    };
    for (const group of groups) {
      map[group.id] = group.group_name;
    }
    return map;
  }, [groups]);

  const selectedValue = groupId ?? NONE;
  const selectedLabel =
    items[selectedValue] ??
    (groupId ? groups.find((g) => g.id === groupId)?.group_name : null) ??
    "اختار مجموعة...";

  return (
    <Select
      disabled={disabled || pending}
      value={selectedValue}
      items={items}
      onValueChange={(value) => {
        if (!value || typeof value !== "string") return;
        const nextId = value === NONE ? null : value;
        const nextName =
          nextId == null ? null : (items[nextId] ?? null);
        startTransition(async () => {
          const result = await setStudentGroup({
            studentId,
            groupId: nextId,
          });
          if (result.ok) {
            onChanged?.(nextId, nextName);
          }
        });
      }}
    >
      <SelectTrigger
        size="sm"
        className={
          compact
            ? "h-8 w-full min-w-[8.5rem] max-w-[11rem] rounded-md border-border/70 bg-background px-2 text-xs shadow-none"
            : "h-10 w-full min-w-[10rem] max-w-xs bg-muted/40 px-3 text-start shadow-none"
        }
        {...spekit(SPEKIT.studentGroupSelect)}
      >
        {!compact && (
          <UsersRound className="size-3.5 shrink-0 text-muted-foreground" />
        )}
        <SelectValue placeholder="اختار مجموعة..." className="text-start">
          {(value: string | null) =>
            value == null || value === NONE
              ? "بدون مجموعة"
              : (items[value] ?? selectedLabel)
          }
        </SelectValue>
      </SelectTrigger>
      <SelectContent align="start" className="min-w-[var(--anchor-width)]">
        <SelectItem value={NONE}>بدون مجموعة</SelectItem>
        {groups.map((group) => (
          <SelectItem key={group.id} value={group.id}>
            {group.group_name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
