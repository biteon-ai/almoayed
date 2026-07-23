import { StudentBottomNav } from "@/components/layout/StudentBottomNav";
import { StudentHeader } from "@/components/layout/StudentHeader";
import { StudentPortalShell } from "@/components/layout/StudentPortalShell";
import { OfflineSyncProvider } from "@/components/pwa/OfflineSyncProvider";
import { ServiceWorkerRegister } from "@/components/pwa/ServiceWorkerRegister";
import { APP_SLOGAN } from "@/lib/constants";

export default function StudentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <StudentPortalShell>
      <ServiceWorkerRegister />
      <OfflineSyncProvider>
        <div className="min-h-dvh bg-gradient-to-b from-slate-50/50 to-white">
          <StudentHeader slogan={APP_SLOGAN} />
          <main className="pb-28 md:pb-0">{children}</main>
          <StudentBottomNav />
        </div>
      </OfflineSyncProvider>
    </StudentPortalShell>
  );
}
