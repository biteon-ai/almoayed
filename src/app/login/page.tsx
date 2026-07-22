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
    <div className="flex min-h-dvh items-center justify-center text-sm text-muted-foreground">
      جاري التحميل…
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
