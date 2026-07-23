import { requireStudent } from "@/lib/auth";

/** Minimal chrome for mandatory onboarding / profile completion (no bottom nav). */
export default async function StudentFlowsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireStudent();

  return (
    <div className="min-h-dvh bg-gradient-to-b from-slate-50 to-white">
      <header className="border-b border-slate-100 bg-white/90 px-4 py-3 backdrop-blur-md">
        <p className="text-lg font-bold text-brand-700">المؤيد</p>
        <p className="text-xs text-muted-foreground">استكمال حسابك</p>
      </header>
      <main className="mx-auto max-w-lg px-4 py-6">{children}</main>
    </div>
  );
}
