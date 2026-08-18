"use client";

import { useEffect } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { verifyFixedOtp, type VerifyFixedOtpState } from "@/actions/auth-otp";
import { AuthField } from "@/components/login/AuthField";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { loginMessageForCode } from "@/lib/login-ui-messages";
import { PLATFORM_SETTINGS_MESSAGES } from "@/lib/platform-settings-messages";
import { SPEKIT, spekit } from "@/lib/spekit-targets";
import { KeyRound, Loader2 } from "lucide-react";

const initial: VerifyFixedOtpState | null = null;

function Submit({ disabled }: { disabled: boolean }) {
  const { pending } = useFormStatus();
  return (
    <Button
      type="submit"
      variant="brand"
      className="h-12 w-full gap-2 rounded-xl text-sm font-bold"
      disabled={pending || disabled}
      aria-busy={pending}
    >
      {pending ? (
        <>
          <Loader2 className="size-4 animate-spin" aria-hidden />
          جاري التحقق…
        </>
      ) : (
        PLATFORM_SETTINGS_MESSAGES.loginOtpSubmit
      )}
    </Button>
  );
}

export function FixedOtpStep({
  stateId,
  whatsapp,
  onSuccess,
}: {
  stateId: string;
  whatsapp: string;
  onSuccess: (role: "TEACHER" | "STUDENT") => void;
}) {
  const [state, action] = useFormState(verifyFixedOtp, initial);

  useEffect(() => {
    if (state?.status === "success") {
      onSuccess(state.role);
    }
    if (state?.status === "needs_teacher_link") {
      window.location.assign("/login?tab=login&needs_teacher=1");
    }
  }, [state, onSuccess]);

  const error =
    state?.status === "error" ? loginMessageForCode(state.code) : null;

  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="state" value={stateId} />
      <input type="hidden" name="whatsapp_number" value={whatsapp} />
      <p className="text-sm text-muted-foreground">
        {PLATFORM_SETTINGS_MESSAGES.loginOtpHelper}
      </p>
      {error ? (
        <p role="alert" className="text-xs font-semibold text-destructive">
          {error}
        </p>
      ) : null}
      <AuthField
        id="fixed_otp_code"
        label={PLATFORM_SETTINGS_MESSAGES.loginOtpLabel}
        icon={KeyRound}
        spekitProps={spekit(SPEKIT.loginFixedOtpField)}
      >
        <Input
          id="fixed_otp_code"
          name="otp_code"
          inputMode="numeric"
          autoComplete="one-time-code"
          className="h-12 font-mono tracking-widest"
          dir="ltr"
          required
          {...spekit(SPEKIT.loginFixedOtpField)}
        />
      </AuthField>
      <Submit disabled={false} />
    </form>
  );
}
