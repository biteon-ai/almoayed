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
import { Loader2, Users } from "lucide-react";
import { SPEKIT, spekit } from "@/lib/spekit-targets";
import { cn } from "@/lib/utils";

const NONE = "none";

const GROUP_ACCENT = [
  "border-emerald-200/80 bg-emerald-50/80 text-emerald-800 dark:border-emerald-800/50 dark:bg-emerald-950/30 dark:text-emerald-300",
  "border-sky-200/80 bg-sky-50/80 text-sky-800 dark:border-sky-800/50 dark:bg-sky-950/30 dark:text-sky-300",
  "border-violet-200/80 bg-violet-50/80 text-violet-800 dark:border-violet-800/50 dark:bg-violet-950/30 dark:text-violet-300",
  "border-rose-200/80 bg-rose-50/80 text-rose-800 dark:border-rose-800/50 dark:bg-rose-950/30 dark:text-rose-300",
] as const;

function groupAccentClass(groupId: string | null): string {
  if (!groupId) {
    return "border-muted bg-background text-muted-foreground hover:bg-muted/50";
  }
  let hash = 0;
  for (let i = 0; i < groupId.length; i += 1) {
    hash = (hash + groupId.charCodeAt(i)) % GROUP_ACCENT.length;
  }
  return GROUP_ACCENT[hash]!;
}

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
    "اختر مجموعة";

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
        className={cn(
          compact
            ? "h-8 w-[160px] rounded-xl border px-2.5 text-xs font-medium shadow-none transition-colors focus-visible:ring-1 focus-visible:ring-emerald-500"
            : "h-10 w-full min-w-[10rem] max-w-xs rounded-xl bg-muted/40 px-3 text-start shadow-none",
          groupAccentClass(groupId)
        )}
        {...spekit(SPEKIT.studentGroupSelect)}
      >
        <div className="flex min-w-0 flex-1 items-center gap-1.5 truncate">
          {pending ? (
            <Loader2 className="size-3.5 shrink-0 animate-spin opacity-70" />
          ) : (
            <Users className="size-3.5 shrink-0 opacity-70" />
          )}
          <SelectValue placeholder="اختر مجموعة" className="truncate text-start">
            {(value: string | null) =>
              value == null || value === NONE
                ? "بدون مجموعة"
                : (items[value] ?? selectedLabel)
            }
          </SelectValue>
        </div>
      </SelectTrigger>
      <SelectContent align="end" className="min-w-[var(--anchor-width)] rounded-xl">
        <SelectItem value={NONE} className="text-xs">
          بدون مجموعة
        </SelectItem>
        {groups.map((group) => (
          <SelectItem key={group.id} value={group.id} className="text-xs">
            <span className="inline-flex items-center gap-1.5">
              <Users className="size-3 text-muted-foreground" />
              {group.group_name}
            </span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
