import { LoginBrandingPanel } from "@/components/login/LoginBrandingPanel";

/** Server shell — keeps branding text out of the client bundle to avoid hydration drift. */
export function LoginPageShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-dvh bg-background lg:grid lg:grid-cols-2" dir="rtl">
      <LoginBrandingPanel />
      <div className="flex min-h-dvh flex-col bg-gradient-to-b from-slate-50/80 via-background to-background dark:from-slate-950/50 dark:via-background">
        <LoginBrandingPanel compact />
        {children}
      </div>
    </div>
  );
}
