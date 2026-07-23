"use client";

import { SPEKIT, spekit } from "@/lib/spekit-targets";
import { BookOpen, GraduationCap, UserCheck } from "lucide-react";

export interface AdminTeachersStatsSummary {
  totalTeachers: number;
  activeTeachers: number;
  totalExams: number;
}

interface AdminTeachersStatsProps {
  stats: AdminTeachersStatsSummary;
}

const cards = [
  {
    key: "totalTeachers" as const,
    spekit: SPEKIT.adminKpiTeachers,
    label: "إجمالي المدرسين",
    icon: GraduationCap,
    accent: "from-brand-500/15 to-brand-600/5",
    iconClass: "text-brand-600",
  },
  {
    key: "activeTeachers" as const,
    spekit: SPEKIT.adminTeacherStatsActive,
    label: "الحسابات النشطة",
    icon: UserCheck,
    accent: "from-emerald-500/15 to-teal-600/5",
    iconClass: "text-emerald-600",
  },
  {
    key: "totalExams" as const,
    spekit: SPEKIT.adminKpiExams,
    label: "إجمالي الاختبارات",
    icon: BookOpen,
    accent: "from-violet-500/15 to-purple-600/5",
    iconClass: "text-violet-600",
  },
];

export function AdminTeachersStats({ stats }: AdminTeachersStatsProps) {
  const values = {
    totalTeachers: stats.totalTeachers,
    activeTeachers: stats.activeTeachers,
    totalExams: stats.totalExams,
  };

  return (
    <div className="grid gap-3 sm:grid-cols-3">
      {cards.map((card) => {
        const Icon = card.icon;
        const value = values[card.key];
        return (
          <div
            key={card.key}
            className={`card-native overflow-hidden bg-gradient-to-br ${card.accent}`}
            {...spekit(card.spekit)}
          >
            <div className="flex items-center justify-between gap-3 p-4">
              <div>
                <p className="text-xs font-bold text-muted-foreground">{card.label}</p>
                <p className="mt-1 text-2xl font-extrabold tabular-nums">
                  {value.toLocaleString("ar-SY")}
                </p>
              </div>
              <div className="rounded-2xl bg-white/70 p-2.5 shadow-sm dark:bg-white/10">
                <Icon className={`size-5 ${card.iconClass}`} />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function getInitials(fullName: string): string {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "؟";
  if (parts.length === 1) return parts[0].slice(0, 2);
  return `${parts[0][0] ?? ""}${parts[parts.length - 1][0] ?? ""}`;
}

export function TeacherAvatar({ fullName }: { fullName: string }) {
  const initials = getInitials(fullName);
  return (
    <div
      aria-hidden
      className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-500 to-teal-600 text-sm font-extrabold text-white shadow-sm"
    >
      {initials}
    </div>
  );
}
