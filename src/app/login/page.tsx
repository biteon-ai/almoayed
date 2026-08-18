import { Suspense } from "react";
import { LoginForm } from "./login-form";
import { LoginPageShell } from "./login-page-shell";
import { getBiteonHostedLoginHref } from "@/lib/biteonswitch/hosted-login-href";
import { isDemoModeEnabled, isFixedOtpUsable } from "@/lib/platform-settings";
import { getPendingTeacherLinkSession } from "@/lib/auth-session";
import { APP_DESCRIPTION, APP_SLOGAN } from "@/lib/constants";

export const metadata = {
  title: "تسجيل الدخول | المؤيد",
  description: `${APP_SLOGAN} — ${APP_DESCRIPTION}`,
};
export const dynamic = "force-dynamic";

function LoginFormFallback() {
  return (
    <div className="flex min-h-dvh items-center justify-center bg-gradient-to-b from-slate-50 via-background to-background p-6 dark:from-slate-950 dark:via-background">
      <p className="text-sm text-muted-foreground">جاري التحميل…</p>
    </div>
  );
}

export default async function LoginPage() {
  const demoEnabled = await isDemoModeEnabled();
  const pending = await getPendingTeacherLinkSession();
  const biteonHostedLoginHref = getBiteonHostedLoginHref();
  const fixedOtpEnabled = await isFixedOtpUsable();

  return (
    <Suspense fallback={<LoginFormFallback />}>
      <LoginPageShell>
        <LoginForm
          demoEnabled={demoEnabled}
          fixedOtpEnabled={fixedOtpEnabled}
          needsTeacherLink={Boolean(pending)}
          pendingWhatsapp={pending?.whatsappNumber ?? ""}
          biteonHostedLoginHref={biteonHostedLoginHref}
        />
      </LoginPageShell>
    </Suspense>
  );
}
