import { Suspense } from "react";
import { LoginForm } from "./login-form";
import { isAuthDemoBypassEnabled } from "@/lib/admin-fallback";
import { getPendingTeacherLinkSession } from "@/lib/auth-session";

export const metadata = {
  title: "تسجيل الدخول | المؤيد",
  description: "حل بيدك ما حدا بفيدك — تسجيل ودخول عبر واتساب",
};

function LoginFormFallback() {
  return (
    <div className="flex h-[calc(100dvh-env(safe-area-inset-top,0px)-env(safe-area-inset-bottom,0px))] max-h-[calc(100dvh-env(safe-area-inset-top,0px)-env(safe-area-inset-bottom,0px))] flex-col items-center justify-center overflow-hidden bg-gradient-to-b from-slate-50 via-background to-background p-4 dark:from-slate-950 dark:via-background sm:p-6">
      <p className="text-sm text-muted-foreground">جاري التحميل…</p>
    </div>
  );
}

export default async function LoginPage() {
  // Gates one-click demo session mint; تجربة tab is hidden when bypass is off
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
