"use client";

import { useEffect, useState } from "react";
import type {
  CategoryPerformance,
  RecentScoreRow,
  StudentTeacherOption,
} from "@/types/database";
import { MyScoresTab } from "@/components/dashboard/MyScoresTab";
import { WeakPointsTab } from "@/components/dashboard/WeakPointsTab";
import { TeachersTab } from "@/components/dashboard/TeachersTab";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  applyDashboardHashFromLocation,
  type DashboardTabValue,
} from "@/lib/student-nav";

interface DashboardTabsProps {
  recentScores: RecentScoreRow[];
  weakPoints: CategoryPerformance[];
  teachers: StudentTeacherOption[];
  currentTeacherId: string | null;
}

export function DashboardTabs({
  recentScores,
  weakPoints,
  teachers,
  currentTeacherId,
}: DashboardTabsProps) {
  const [tab, setTab] = useState<DashboardTabValue>("scores");

  useEffect(() => {
    const syncFromHash = (isInitialMount = false) =>
      applyDashboardHashFromLocation(setTab, { isInitialMount });

    syncFromHash(true);
    const onHashChange = () => syncFromHash(false);
    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, []);

  return (
    <section
      id="dashboard-tabs"
      className="scroll-mt-24 scroll-mb-24 rounded-2xl border border-slate-100 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900 dark:shadow-none md:scroll-mb-0 md:p-6"
    >
      <Tabs
        value={tab}
        onValueChange={(value) => {
          const next = value as DashboardTabValue;
          setTab(next);
          if (typeof window !== "undefined") {
            const nextHash = `#${next}`;
            if (window.location.hash !== nextHash) {
              window.history.replaceState(null, "", `/dashboard${nextHash}`);
              window.dispatchEvent(new HashChangeEvent("hashchange"));
            }
          }
        }}
        className="w-full"
      >
        <TabsList className="h-11 w-full">
          <TabsTrigger value="scores" className="flex-1 text-center">
            نتائجي
          </TabsTrigger>
          <TabsTrigger value="weak" className="flex-1 text-center">
            نقاط الضعف
          </TabsTrigger>
          <TabsTrigger value="teachers" className="flex-1 text-center">
            أساتذتي
          </TabsTrigger>
        </TabsList>
        <TabsContent value="scores">
          <MyScoresTab scores={recentScores} />
        </TabsContent>
        <TabsContent value="weak">
          <WeakPointsTab categories={weakPoints} />
        </TabsContent>
        <TabsContent value="teachers">
          <TeachersTab
            teachers={teachers}
            currentTeacherId={currentTeacherId}
          />
        </TabsContent>
      </Tabs>
    </section>
  );
}
