"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { MobileShell } from "@/components/layout/MobileShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { BrandHeader } from "@/components/brand/BrandHeader";
import { SPEKIT, spekit } from "@/lib/spekit-targets";
import { Loader2, Shield } from "lucide-react";

export function SuperAdminLoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);
    setError(null);

    try {
      const res = await fetch("/api/admin/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = (await res.json()) as { error?: string; redirectTo?: string };
      if (!res.ok) {
        setError(data.error ?? "تعذر تسجيل الدخول.");
        return;
      }
      router.push(data.redirectTo ?? "/admin/dashboard");
      router.refresh();
    } catch {
      setError("تعذر الاتصال بالخادم.");
    } finally {
      setPending(false);
    }
  }

  return (
    <MobileShell className="min-h-dvh bg-gradient-to-b from-brand-50/40 via-background to-background">
      <div className="px-2 pb-6 pt-2">
        <BrandHeader />
      </div>

      <form
        onSubmit={onSubmit}
        className="card-native mx-auto max-w-md"
        {...spekit(SPEKIT.adminLoginForm)}
      >
        <div className="card-native-header">
          <h1 className="flex items-center gap-2 text-lg font-extrabold">
            <Shield className="size-5 text-brand-600" />
            دخول Super Admin
          </h1>
          <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">
            لوحة إدارة المنصة — غير مخصصة للطلاب أو المدرسين
          </p>
        </div>

        <div className="space-y-4 p-5">
          <div className="space-y-2">
            <Label htmlFor="admin_email">البريد الإلكتروني</Label>
            <Input
              id="admin_email"
              type="email"
              dir="ltr"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="h-12"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="admin_password">كلمة المرور</Label>
            <Input
              id="admin_password"
              type="password"
              dir="ltr"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="h-12"
            />
          </div>
          {error ? (
            <div
              role="alert"
              className="rounded-xl border border-destructive/25 bg-destructive/5 px-3.5 py-3 text-xs font-semibold text-destructive"
            >
              {error}
            </div>
          ) : null}
          <Button type="submit" variant="brand" size="touch" className="w-full" disabled={pending}>
            {pending ? (
              <>
                <Loader2 className="size-5 animate-spin" />
                جاري الدخول...
              </>
            ) : (
              "دخول لوحة الأدمن"
            )}
          </Button>
        </div>
      </form>
    </MobileShell>
  );
}
