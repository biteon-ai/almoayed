import { Suspense } from "react";
import { LoginForm } from "./login-form";
import { isAuthDemoBypassEnabled } from "@/lib/admin-fallback";
import { getPendingTeacherLinkSession } from "@/lib/auth-session";
import { APP_DESCRIPTION, APP_SLOGAN } from "@/lib/constants";

export const metadata = {
  title: "تسجيل الدخول | المؤيد",
  description: `${APP_SLOGAN} — ${APP_DESCRIPTION}`,
};

function LoginFormFallback() {
  return (
    <div className="flex min-h-dvh items-center justify-center bg-gradient-to-b from-slate-50 via-background to-background p-6 dark:from-slate-950 dark:via-background">
      <p className="text-sm text-muted-foreground">جاري التحميل…</p>
    </div>
  );
}

export default async function LoginPage() {
  const demoEnabled = isAuthDemoBypassEnabled();
  const pending = await getPendingTeacherLinkSession();

  return (
    <Suspense fallback={<LoginFormFallback />}>
      <LoginForm
        demoEnabled={demoEnabled}
        needsTeacherLink={Boolean(pending)}
        pendingWhatsapp={pending?.whatsappNumber ?? ""}
      />
    </Suspense>
  );
}
