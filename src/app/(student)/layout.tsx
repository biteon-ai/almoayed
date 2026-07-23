import { StudentBottomNav } from "@/components/layout/StudentBottomNav";
import { StudentHeader } from "@/components/layout/StudentHeader";
import { StudentPortalShell } from "@/components/layout/StudentPortalShell";

export default function StudentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <StudentPortalShell>
      <div className="min-h-dvh bg-gradient-to-b from-slate-50/50 to-white">
        <StudentHeader />
        <main className="pb-20 md:pb-0">{children}</main>
        <StudentBottomNav />
      </div>
    </StudentPortalShell>
  );
}
