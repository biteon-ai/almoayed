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

interface DashboardTabsProps {
  recentScores: RecentScoreRow[];
  weakPoints: CategoryPerformance[];
  teachers: StudentTeacherOption[];
  currentTeacherId: string | null;
}

type TabValue = "scores" | "weak" | "teachers";

function hashToTab(hash: string): TabValue | null {
  const h = hash.replace(/^#/, "");
  if (h === "scores" || h === "weak" || h === "teachers") return h;
  return null;
}

export function DashboardTabs({
  recentScores,
  weakPoints,
  teachers,
  currentTeacherId,
}: DashboardTabsProps) {
  const [tab, setTab] = useState<TabValue>("scores");

  useEffect(() => {
    const applyHash = () => {
      const fromHash = hashToTab(window.location.hash);
      if (fromHash) {
        setTab(fromHash);
        if (fromHash !== "scores" || window.location.hash === "#scores") {
          window.requestAnimationFrame(() => {
            document.getElementById("dashboard-tabs")?.scrollIntoView({
              behavior: "smooth",
              block: "start",
            });
          });
        }
      }
    };

    applyHash();
    window.addEventListener("hashchange", applyHash);
    return () => window.removeEventListener("hashchange", applyHash);
  }, []);

  useEffect(() => {
    const raw = window.location.hash.replace(/^#/, "");
    if (raw === "quizzes") {
      document.getElementById("quizzes")?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }
  }, []);

  return (
    <section
      id="dashboard-tabs"
      className="scroll-mt-24 rounded-2xl border border-slate-100 bg-white p-4 shadow-sm md:p-6"
    >
      <Tabs
        value={tab}
        onValueChange={(v) => {
          const next = v as TabValue;
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
