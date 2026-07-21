import { Suspense } from "react";
import { LoginForm } from "./login-form";
import { isAuthDemoBypassEnabled } from "@/lib/admin-fallback";

export const metadata = {
  title: "تسجيل طالب | المؤيد",
  description: "حل بيدك ما حدا بفيدك — تسجيل طالب جديد ودخول عبر واتساب",
};

function LoginFormFallback() {
  return (
    <div className="flex min-h-dvh items-center justify-center text-sm text-muted-foreground">
      جاري التحميل…
    </div>
  );
}

export default function LoginPage() {
  const demoEnabled = isAuthDemoBypassEnabled();
  return (
    <Suspense fallback={<LoginFormFallback />}>
      <LoginForm demoEnabled={demoEnabled} />
    </Suspense>
  );
}
