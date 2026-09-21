"use client";

import type { AdminKpiSnapshot } from "@/types/database";
import { SPEKIT, spekit } from "@/lib/spekit-targets";
import {
  BookOpen,
  ClipboardCheck,
  GraduationCap,
  Users,
  UserSquare2,
} from "lucide-react";

interface AdminKpiCardsProps {
  kpis: AdminKpiSnapshot;
}

const cards = [
  {
    key: "totalUsers" as const,
    spekit: SPEKIT.adminKpiTotalUsers,
    label: "إجمالي المستخدمين",
    icon: Users,
    accent: "from-brand-500/15 to-brand-600/5",
  },
  {
    key: "teachers" as const,
    spekit: SPEKIT.adminKpiTeachers,
    label: "إجمالي المدرسين",
    icon: GraduationCap,
    accent: "from-teal-500/15 to-emerald-600/5",
  },
  {
    key: "totalStudents" as const,
    spekit: SPEKIT.adminKpiStudents,
    label: "إجمالي الطلاب",
    icon: UserSquare2,
    accent: "from-sky-500/15 to-blue-600/5",
  },
  {
    key: "totalExams" as const,
    spekit: SPEKIT.adminKpiExams,
    label: "إجمالي الاختبارات",
    icon: BookOpen,
    accent: "from-violet-500/15 to-purple-600/5",
  },
  {
    key: "completedAttempts" as const,
    spekit: SPEKIT.adminKpiAttempts,
    label: "إجمالي المحاولات المكتملة",
    icon: ClipboardCheck,
    accent: "from-amber-500/15 to-orange-600/5",
  },
];

export function AdminKpiCards({ kpis }: AdminKpiCardsProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {cards.map((card) => {
        const Icon = card.icon;
        let value: string | number = 0;
        let sub: string | null = null;

        if (card.key === "totalUsers") value = kpis.totalUsers;
        if (card.key === "teachers") {
          value = kpis.totalTeachers;
          sub = `نشط: ${kpis.activeTeachers} · معطّل: ${kpis.inactiveTeachers}`;
        }
        if (card.key === "totalStudents") value = kpis.totalStudents;
        if (card.key === "totalExams") {
          value = kpis.totalExams;
          sub = `منشور: ${kpis.publishedExams} · مسودة: ${kpis.draftExams}`;
        }
        if (card.key === "completedAttempts") value = kpis.completedAttempts;

        return (
          <div
            key={card.key}
            className={`card-native overflow-hidden bg-gradient-to-br ${card.accent}`}
            {...spekit(card.spekit)}
          >
            <div className="flex items-start justify-between gap-4 p-6">
              <div>
                <p className="text-xs font-bold text-muted-foreground">{card.label}</p>
                <p className="mt-2 text-3xl font-extrabold tabular-nums text-foreground">
                  {value.toLocaleString("en-US")}
                </p>
                {sub ? (
                  <p className="mt-1.5 text-[11px] font-semibold text-brand-700 dark:text-brand-300">
                    {sub}
                  </p>
                ) : null}
              </div>
              <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-emerald-50 p-3 text-emerald-600 shadow-sm dark:bg-emerald-950/40 dark:text-emerald-300">
                <Icon className="size-6 text-brand-600" />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
