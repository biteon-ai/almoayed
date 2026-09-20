import { StudentBottomNav } from "@/components/layout/StudentBottomNav";
import { StudentHeader } from "@/components/layout/StudentHeader";
import { StudentPortalShell } from "@/components/layout/StudentPortalShell";
import { OfflineSyncProvider } from "@/components/pwa/OfflineSyncProvider";
import { PwaInstallSheet } from "@/components/pwa/PwaInstallSheet";
import { APP_SLOGAN } from "@/lib/constants";
import { requireStudent } from "@/lib/auth";
import { enforceStudentOnboardingComplete } from "@/lib/student-onboarding-guard";

export default async function StudentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await enforceStudentOnboardingComplete();
  const session = await requireStudent();

  return (
    <StudentPortalShell>
      <OfflineSyncProvider>
        <div className="min-h-dvh bg-background">
          <StudentHeader
            slogan={APP_SLOGAN}
            currentTeacherId={session.currentTeacherId}
          />
          <main className="pb-28 md:pb-0">{children}</main>
          <StudentBottomNav />
          <PwaInstallSheet />
        </div>
      </OfflineSyncProvider>
    </StudentPortalShell>
  );
}
