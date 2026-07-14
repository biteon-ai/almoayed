import { StudentHeader } from "@/components/layout/StudentHeader";
import { StudentBottomNav } from "@/components/layout/StudentBottomNav";

export default function StudentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-dvh bg-gradient-to-b from-slate-50/50 to-white">
      <StudentHeader />
      <main className="pb-20 md:pb-0">{children}</main>
      <StudentBottomNav />
    </div>
  );
}
