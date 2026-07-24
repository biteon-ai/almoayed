"use client";

import { useEffect, useState } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { loginAdminFallback } from "@/actions/auth";
import type { LoginState } from "@/types/auth";
import { loginMessageForCode } from "@/lib/login-ui-messages";
import { LoginLoadingOverlay } from "@/components/login/LoginLoadingOverlay";
import { MobileShell, StickyBottomBar } from "@/components/layout/MobileShell";
import { useLoadingBarSync } from "@/components/providers/top-loader-provider";
import {
  ActiveLoginLoaderBar,
  startTopNavLoader,
} from "@/components/ui/top-loader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { BrandHeader } from "@/components/brand/BrandHeader";
import { KeyRound, Loader2, MessageCircle, Shield } from "lucide-react";
import { SPEKIT, spekit } from "@/lib/spekit-targets";

const initialState: LoginState | null = null;

function PendingWatcher({
  onPendingChange,
}: {
  onPendingChange: (pending: boolean) => void;
}) {
  const { pending } = useFormStatus();
  useEffect(() => {
    onPendingChange(pending);
  }, [pending, onPendingChange]);
  return null;
}

function SubmitButton({ forceDisabled = false }: { forceDisabled?: boolean }) {
  const { pending } = useFormStatus();
  return (
    <Button
      type="submit"
      variant="brand"
      size="touch"
      className="w-full"
      disabled={pending || forceDisabled}
      aria-busy={pending}
    >
      {pending ? (
        <>
          <Loader2 className="size-5 animate-spin" aria-hidden />
          جاري التحقق...
        </>
      ) : (
        <>
          <Shield className="size-5" aria-hidden />
          دخول الطوارئ
        </>
      )}
    </Button>
  );
}

/** AUTH-005 + AUTH-006 — emergency teacher login with instant loading feedback. */
export function AdminLoginForm() {
  const [state, formAction] = useFormState(loginAdminFallback, initialState);
  const [whatsapp, setWhatsapp] = useState("");
  const [secret, setSecret] = useState("");
  const [busy, setBusy] = useState(false);
  const [overlay, setOverlay] = useState(false);

  const isBusy = busy || overlay;
  useLoadingBarSync(isBusy);

  useEffect(() => {
    if (state?.status === "success") {
      setOverlay(true);
      window.location.assign("/teacher/dashboard");
      return;
    }
    if (state?.status === "error") {
      setBusy(false);
      setOverlay(false);
    }
  }, [state]);

  return (
    <MobileShell className="min-h-dvh bg-gradient-to-b from-slate-100 via-background to-background">
      <ActiveLoginLoaderBar active={isBusy} />
      <LoginLoadingOverlay
        show={overlay}
        message="جاري التحقق…"
        subMessage="لحظة من فضلك…"
      />

      <div className="px-2 pb-6 pt-2">
        <BrandHeader />
      </div>

      <form
        action={formAction}
        className="card-native mx-auto max-w-md"
        aria-busy={isBusy}
        onSubmit={() => {
          startTopNavLoader();
          setBusy(true);
          setOverlay(true);
        }}
        {...spekit(SPEKIT.adminLoginForm)}
      >
        <PendingWatcher
          onPendingChange={(pending) => {
            setBusy(pending);
            if (pending) {
              setOverlay(true);
              startTopNavLoader();
            }
          }}
        />
        <div className="card-native-header">
          <h1 className="flex items-center gap-2 text-lg font-extrabold">
            <KeyRound className="size-5 text-brand-600" />
            دخول إداري للطوارئ
          </h1>
          <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">
            للاستخدام عند تعطّل خدمة واتساب OTP فقط — غير مخصص للطلاب
          </p>
        </div>

        <div className="space-y-4 p-5">
          <div className="space-y-2">
            <Label
              htmlFor="admin_whatsapp"
              className="flex items-center gap-1.5 text-xs font-bold"
            >
              <MessageCircle className="size-3.5 text-brand-600" />
              رقم واتساب الأدمن
            </Label>
            <Input
              id="admin_whatsapp"
              name="whatsapp_number"
              type="tel"
              inputMode="numeric"
              dir="ltr"
              value={whatsapp}
              onChange={(e) => setWhatsapp(e.target.value)}
              placeholder="9639xxxxxxxx"
              required
              disabled={isBusy}
              className="h-12"
            />
          </div>

          <div className="space-y-2">
            <Label
              htmlFor="admin_secret"
              className="flex items-center gap-1.5 text-xs font-bold"
            >
              <Shield className="size-3.5 text-brand-600" />
              مفتاح الطوارئ
            </Label>
            <Input
              id="admin_secret"
              name="admin_secret"
              type="password"
              autoComplete="current-password"
              value={secret}
              onChange={(e) => setSecret(e.target.value)}
              required
              disabled={isBusy}
              className="h-12"
              dir="ltr"
            />
          </div>

          {state?.status === "error" && !isBusy ? (
            <div
              role="alert"
              className="rounded-xl border border-destructive/25 bg-destructive/5 px-3.5 py-3 text-xs font-semibold text-destructive"
            >
              {loginMessageForCode(state.code)}
            </div>
          ) : null}
        </div>

        <StickyBottomBar className="relative border-0 bg-transparent px-5 pb-5 shadow-none">
          <SubmitButton forceDisabled={isBusy} />
        </StickyBottomBar>
      </form>
    </MobileShell>
  );
}
