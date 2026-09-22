"use client";

import { usePathname } from "next/navigation";
import { StudentBottomNav } from "@/components/layout/StudentBottomNav";
import { StudentHeader } from "@/components/layout/StudentHeader";
import { PwaInstallSheet } from "@/components/pwa/PwaInstallSheet";
import { cn } from "@/lib/utils";

/**
 * Student chrome — hides global header/bottom nav on live quiz routes so
 * QuizPlayerHeader is the single top chrome (UI immersive taking).
 */
export function StudentAppChrome({
  slogan,
  currentTeacherId,
  children,
}: {
  slogan: string;
  currentTeacherId: string | null;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isQuizTaking = pathname.startsWith("/quiz/");

  return (
    <div className="min-h-dvh bg-background">
      <StudentHeader
        slogan={slogan}
        currentTeacherId={currentTeacherId}
        chromeMode={isQuizTaking ? "progress-only" : "full"}
      />
      <main className={cn(isQuizTaking ? "pb-6 md:pb-0" : "pb-28 md:pb-0")}>
        {children}
      </main>
      {isQuizTaking ? null : <StudentBottomNav />}
      <PwaInstallSheet />
    </div>
  );
}
