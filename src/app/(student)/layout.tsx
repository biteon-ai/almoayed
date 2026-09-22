import { StudentAppChrome } from "@/components/layout/StudentAppChrome";
import { StudentPortalShell } from "@/components/layout/StudentPortalShell";
import { OfflineSyncProvider } from "@/components/pwa/OfflineSyncProvider";
import { APP_SLOGAN } from "@/lib/constants";
import { requireStudent } from "@/lib/auth";
import { enforceStudentOnboardingComplete } from "@/lib/student-onboarding-guard";

/** Session-scoped chrome — personalized; never statically prerender. */
export const dynamic = "force-dynamic";

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
        <StudentAppChrome
          slogan={APP_SLOGAN}
          currentTeacherId={session.currentTeacherId}
        >
          {children}
        </StudentAppChrome>
      </OfflineSyncProvider>
    </StudentPortalShell>
  );
}
