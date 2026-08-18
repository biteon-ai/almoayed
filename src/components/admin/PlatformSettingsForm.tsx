"use client";

import { useState, useTransition, useRef } from "react";
import {
  updatePlatformSettings,
  type PlatformSettingsPatch,
} from "@/actions/platform-settings";
import { HubToast } from "@/components/teacher/HubToast";
import { StatusBadge } from "@/components/ui/status-badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import type { PlatformSettings } from "@/lib/platform-settings";
import { PLATFORM_SETTINGS_MESSAGES } from "@/lib/platform-settings-messages";
import { SPEKIT, spekit } from "@/lib/spekit-targets";
import { cn } from "@/lib/utils";
import { FlaskConical, KeyRound, Loader2 } from "lucide-react";

function SettingSwitch({
  checked,
  disabled,
  pending,
  label,
  spekitProps,
  onCheckedChange,
}: {
  checked: boolean;
  disabled: boolean;
  pending: boolean;
  label: string;
  spekitProps: ReturnType<typeof spekit>;
  onCheckedChange: (value: boolean) => void;
}) {
  return (
    <div className="flex shrink-0 items-center gap-2">
      <StatusBadge tone={checked ? "active" : "deactivated"}>
        {checked
          ? PLATFORM_SETTINGS_MESSAGES.statusOn
          : PLATFORM_SETTINGS_MESSAGES.statusOff}
      </StatusBadge>
      <span className="inline-flex size-9 items-center justify-center" {...spekitProps}>
        {pending ? (
          <Loader2 className="size-4 animate-spin text-brand-600" aria-hidden />
        ) : (
          <Switch
            checked={checked}
            disabled={disabled}
            onCheckedChange={onCheckedChange}
            aria-label={label}
          />
        )}
      </span>
    </div>
  );
}

export function PlatformSettingsForm({
  initial,
}: {
  initial: PlatformSettings;
}) {
  const [settings, setSettings] = useState(initial);
  const lastGood = useRef(initial);
  const [code, setCode] = useState(initial.fixedOtpCode);
  const [pendingKey, setPendingKey] = useState<string | null>(null);
  const [toast, setToast] = useState<{
    message: string;
    tone: "success" | "error";
  } | null>(null);
  const [, startTransition] = useTransition();

  const save = (patch: PlatformSettingsPatch, key: string) => {
    setPendingKey(key);
    startTransition(async () => {
      try {
        const result = await updatePlatformSettings(patch);
        if (!result || result.status === "error") {
          setSettings(lastGood.current);
          setCode(lastGood.current.fixedOtpCode);
          setToast({
            message: result?.message ?? PLATFORM_SETTINGS_MESSAGES.saveError,
            tone: "error",
          });
          return;
        }
        lastGood.current = result.settings;
        setSettings(result.settings);
        setCode(result.settings.fixedOtpCode);
        setToast({
          message: PLATFORM_SETTINGS_MESSAGES.saveSuccess,
          tone: "success",
        });
      } catch {
        setSettings(lastGood.current);
        setCode(lastGood.current.fixedOtpCode);
        setToast({
          message: PLATFORM_SETTINGS_MESSAGES.saveError,
          tone: "error",
        });
      } finally {
        setPendingKey(null);
      }
    });
  };

  const busy = pendingKey !== null;
  const unusable =
    settings.fixedOtpEnabled && !/^\d{4,8}$/.test(settings.fixedOtpCode);

  return (
    <div
      className="grid gap-4 md:grid-cols-2"
      {...spekit(SPEKIT.adminPlatformSettings)}
    >
      <section className="card-native bg-gradient-to-br from-teal-500/12 to-emerald-600/5">
        <div className="flex items-start gap-4 p-5 sm:p-6">
          <div className="rounded-2xl bg-white/80 p-3 shadow-sm dark:bg-white/10">
            <FlaskConical className="size-6 text-brand-600" aria-hidden />
          </div>
          <div className="min-w-0 flex-1 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-base font-extrabold leading-snug">
                {PLATFORM_SETTINGS_MESSAGES.demoTitle}
              </p>
              <SettingSwitch
                checked={settings.demoModeEnabled}
                disabled={busy}
                pending={pendingKey === "demo"}
                label={PLATFORM_SETTINGS_MESSAGES.demoTitle}
                spekitProps={spekit(SPEKIT.adminDemoModeSwitch)}
                onCheckedChange={(value) => {
                  setSettings((prev) => ({ ...prev, demoModeEnabled: value }));
                  save({ demoModeEnabled: value }, "demo");
                }}
              />
            </div>
            <p className="text-sm leading-relaxed text-muted-foreground">
              {PLATFORM_SETTINGS_MESSAGES.demoHelper}
            </p>
          </div>
        </div>
      </section>

      <section className="card-native bg-gradient-to-br from-sky-500/12 to-brand-600/5">
        <div className="flex items-start gap-4 p-5 sm:p-6">
          <div className="rounded-2xl bg-white/80 p-3 shadow-sm dark:bg-white/10">
            <KeyRound className="size-6 text-brand-600" aria-hidden />
          </div>
          <div className="min-w-0 flex-1 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-base font-extrabold leading-snug">
                {PLATFORM_SETTINGS_MESSAGES.fixedOtpTitle}
              </p>
              <SettingSwitch
                checked={settings.fixedOtpEnabled}
                disabled={busy}
                pending={pendingKey === "fixed"}
                label={PLATFORM_SETTINGS_MESSAGES.fixedOtpTitle}
                spekitProps={spekit(SPEKIT.adminFixedOtpSwitch)}
                onCheckedChange={(value) => {
                  setSettings((prev) => ({ ...prev, fixedOtpEnabled: value }));
                  save({ fixedOtpEnabled: value }, "fixed");
                }}
              />
            </div>
            <p className="text-sm leading-relaxed text-muted-foreground">
              {PLATFORM_SETTINGS_MESSAGES.fixedOtpHelper}
            </p>

            {unusable ? (
              <p className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-800 dark:border-amber-900/50 dark:bg-amber-950/40 dark:text-amber-200">
                {PLATFORM_SETTINGS_MESSAGES.unusableCodeWarning}
              </p>
            ) : null}

            <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
              <div className="min-w-0 flex-1 space-y-1.5">
                <Label htmlFor="fixed-otp-code" className="text-xs font-semibold">
                  {PLATFORM_SETTINGS_MESSAGES.fixedOtpCodeLabel}
                </Label>
                <Input
                  id="fixed-otp-code"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  inputMode="numeric"
                  placeholder="123456"
                  dir="ltr"
                  className="h-11 max-w-xs font-mono tracking-[0.35em]"
                  disabled={busy}
                  {...spekit(SPEKIT.adminFixedOtpCode)}
                />
              </div>
              <Button
                type="button"
                variant="brand"
                className={cn("h-11 shrink-0 px-5 sm:w-auto")}
                disabled={busy}
                onClick={() => save({ fixedOtpCode: code }, "code")}
                {...spekit(SPEKIT.adminSettingsSave)}
              >
                {pendingKey === "code" ? (
                  <>
                    <Loader2 className="size-4 animate-spin" aria-hidden />
                    جاري الحفظ…
                  </>
                ) : (
                  PLATFORM_SETTINGS_MESSAGES.saveCode
                )}
              </Button>
            </div>
          </div>
        </div>
      </section>

      <HubToast
        message={toast?.message ?? null}
        tone={toast?.tone}
        onDismiss={() => setToast(null)}
      />
    </div>
  );
}
