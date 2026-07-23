import { StudentBottomNav } from "@/components/layout/StudentBottomNav";
import { StudentHeader } from "@/components/layout/StudentHeader";
import { StudentPortalShell } from "@/components/layout/StudentPortalShell";
import { OfflineSyncProvider } from "@/components/pwa/OfflineSyncProvider";
import { ServiceWorkerRegister } from "@/components/pwa/ServiceWorkerRegister";

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
          <StudentHeader />
          <main className="pb-20 md:pb-0">{children}</main>
          <StudentBottomNav />
        </div>
      </OfflineSyncProvider>
    </StudentPortalShell>
  );
}
