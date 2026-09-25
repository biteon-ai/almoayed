"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { TeacherBottomNav } from "@/components/layout/TeacherBottomNav";
import { TeacherHeader } from "@/components/layout/TeacherHeader";
import { prefetchTeacherCoreRoutes } from "@/lib/post-login-navigation";

/**
 * Teacher chrome — sticky header + fixed bottom tabs (md:hidden),
 * matching student portal mobile/PWA shell structure (UI-023).
 */
export function TeacherAppChrome({
  slogan,
  children,
}: {
  slogan: string;
  children: React.ReactNode;
}) {
  const router = useRouter();

  useEffect(() => {
    prefetchTeacherCoreRoutes(router);
  }, [router]);

  return (
    <div className="min-h-dvh bg-background">
      <TeacherHeader slogan={slogan} />
      <main className="mx-auto max-w-6xl px-4 py-6 pb-28 md:pb-6">{children}</main>
      <TeacherBottomNav />
    </div>
  );
}
