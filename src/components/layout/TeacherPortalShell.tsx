"use client";

import { NavigationProgressBar } from "@/components/layout/NavigationProgressBar";

export function TeacherPortalShell({
  children,
}: {
  children: React.ReactNode;
}) {
  return <NavigationProgressBar>{children}</NavigationProgressBar>;
}
