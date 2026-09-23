import { requireStudent } from "@/lib/auth";

/** Minimal chrome for mandatory onboarding / profile completion (no bottom nav). */
export default async function StudentFlowsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireStudent();

  return (
    <div className="min-h-dvh bg-gradient-to-b from-slate-50 to-white dark:from-slate-950 dark:to-slate-900">
      <header className="border-b border-slate-100 bg-white/90 px-4 py-3 backdrop-blur-md dark:border-slate-800 dark:bg-slate-950/90">
        <p className="text-lg font-bold text-brand-700 dark:text-brand-300">
          المؤيد
        </p>
        <p className="text-xs text-muted-foreground dark:text-slate-300">
          استكمال حسابك
        </p>
      </header>
      <main className="mx-auto max-w-lg px-4 py-6 text-foreground">{children}</main>
    </div>
  );
}
