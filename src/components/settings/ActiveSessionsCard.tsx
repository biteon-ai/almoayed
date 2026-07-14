"use client";

import { useState, useTransition } from "react";
import { logoutOtherDevices } from "@/actions/profile";
import { Button } from "@/components/ui/button";
import {
  SettingsCard,
  SettingsCardBody,
  SettingsCardHeader,
  SettingsMessage,
} from "@/components/settings/settings-ui";
import { SPEKIT, spekit } from "@/lib/spekit-targets";
import { Loader2, MonitorSmartphone, ShieldCheck } from "lucide-react";

export function ActiveSessionsCard() {
  const [message, setMessage] = useState<string | null>(null);
  const [isError, setIsError] = useState(false);
  const [pending, startTransition] = useTransition();

  const handleLogoutOthers = () => {
    startTransition(async () => {
      const result = await logoutOtherDevices();
      setMessage(result.message);
      setIsError(!result.success);
    });
  };

  return (
    <SettingsCard {...spekit(SPEKIT.profileSessionManagement)}>
      <SettingsCardHeader
        icon={MonitorSmartphone}
        title="الجلسات النشطة"
        description="إدارة الأجهزة المتصلة بحسابك"
      />
      <SettingsCardBody>
        <div className="flex items-center gap-3.5 rounded-xl border border-emerald-200/80 bg-emerald-50/70 px-4 py-4 text-start">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
            <ShieldCheck className="size-4" aria-hidden />
          </div>
          <div className="min-w-0 space-y-1">
            <p className="text-sm font-semibold text-emerald-950">
              هذا الجهاز نشط
            </p>
            <p className="text-xs leading-relaxed text-emerald-800/85">
              جلسة تسجيل الدخول الحالية شغّالة على هذا المتصفح.
            </p>
          </div>
        </div>
        <Button
          type="button"
          variant="outline"
          className="h-12 w-full rounded-xl border-slate-200"
          onClick={handleLogoutOthers}
          disabled={pending}
        >
          {pending ? (
            <>
              <Loader2 className="size-4 animate-spin" />
              عم يُنفَّذ...
            </>
          ) : (
            "تسجيل خروج الأجهزة الأخرى"
          )}
        </Button>
        {message ? (
          <SettingsMessage message={message} isError={isError} />
        ) : null}
      </SettingsCardBody>
    </SettingsCard>
  );
}
