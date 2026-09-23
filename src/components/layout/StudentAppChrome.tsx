"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { StudentBottomNav } from "@/components/layout/StudentBottomNav";
import {
  StudentChromeProvider,
  useStudentQuizImmersive,
} from "@/components/layout/StudentChromeContext";
import { StudentHeader } from "@/components/layout/StudentHeader";
import { PwaInstallSheet } from "@/components/pwa/PwaInstallSheet";
import { prefetchStudentCoreRoutes } from "@/lib/post-login-navigation";
import { cn } from "@/lib/utils";

function StudentAppChromeInner({
  slogan,
  currentTeacherId,
  children,
}: {
  slogan: string;
  currentTeacherId: string | null;
  children: React.ReactNode;
}) {
  const router = useRouter();
  const isQuizImmersive = useStudentQuizImmersive();

  // Warm hub bundles while the student is already authenticated.
  useEffect(() => {
    prefetchStudentCoreRoutes(router);
  }, [router]);

  return (
    <div className="min-h-dvh bg-background">
      <StudentHeader
        slogan={slogan}
        currentTeacherId={currentTeacherId}
        chromeMode={isQuizImmersive ? "progress-only" : "full"}
      />
      <main className={cn(isQuizImmersive ? "pb-6 md:pb-0" : "pb-28 md:pb-0")}>
        {children}
      </main>
      {isQuizImmersive ? null : <StudentBottomNav />}
      <PwaInstallSheet />
    </div>
  );
}

/**
 * Student chrome — hub header + bottom nav stay mounted during route `loading.tsx`
 * (including `/quiz/[id]`). Immersive mode starts only after QuizRunner mounts.
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
  return (
    <StudentChromeProvider>
      <StudentAppChromeInner
        slogan={slogan}
        currentTeacherId={currentTeacherId}
      >
        {children}
      </StudentAppChromeInner>
    </StudentChromeProvider>
  );
}
