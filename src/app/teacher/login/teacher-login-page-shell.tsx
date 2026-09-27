import { TeacherLoginBrandingPanel } from "@/components/login/TeacherLoginBrandingPanel";

/** Server shell — keeps branding text out of the client bundle to avoid hydration drift. */
export function TeacherLoginPageShell({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-dvh bg-background lg:grid lg:grid-cols-2" dir="rtl">
      <TeacherLoginBrandingPanel />
      <div className="flex min-h-dvh flex-col bg-gradient-to-b from-slate-50/80 via-background to-background dark:from-slate-950/50 dark:via-background">
        <TeacherLoginBrandingPanel compact />
        {children}
      </div>
    </div>
  );
}
