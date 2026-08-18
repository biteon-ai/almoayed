"use server";

import { revalidatePath } from "next/cache";
import { getSession, requireSuperAdmin } from "@/lib/auth";
import { isSuperAdminSession } from "@/lib/admin/require-super-admin";
import { getAuthSupabaseClient } from "@/lib/auth-session";
import { logAuthFailure } from "@/lib/auth-error-codes";
import {
  getPlatformSettings,
  PLATFORM_SETTING_KEYS,
  refreshPlatformSettings,
  type PlatformSettings,
  validateFixedOtpCode,
} from "@/lib/platform-settings";
import { PLATFORM_SETTINGS_MESSAGES } from "@/lib/platform-settings-messages";

export type PlatformSettingsPatch = {
  demoModeEnabled?: boolean;
  fixedOtpEnabled?: boolean;
  fixedOtpCode?: string;
};

export type PlatformSettingsState =
  | { status: "success"; settings: PlatformSettings }
  | { status: "error"; message: string };

export async function getAdminPlatformSettings(): Promise<PlatformSettingsState> {
  await requireSuperAdmin();
  try {
    const settings = await getPlatformSettings();
    return { status: "success", settings };
  } catch (error) {
    logAuthFailure("PLATFORM_SETTINGS_LOAD_FAILED", error);
    return { status: "error", message: PLATFORM_SETTINGS_MESSAGES.loadError };
  }
}

export async function updatePlatformSettings(
  patch: PlatformSettingsPatch
): Promise<PlatformSettingsState> {
  const session = await getSession();
  if (!isSuperAdminSession(session)) {
    return { status: "error", message: PLATFORM_SETTINGS_MESSAGES.unauthorized };
  }

  if (patch.fixedOtpCode !== undefined) {
    const validated = validateFixedOtpCode(patch.fixedOtpCode);
    if (!validated.ok) {
      return { status: "error", message: validated.message };
    }
    patch = { ...patch, fixedOtpCode: validated.value };
  }

  const supabase = getAuthSupabaseClient();
  if (!supabase) {
    return { status: "error", message: PLATFORM_SETTINGS_MESSAGES.saveError };
  }

  const now = new Date().toISOString();
  const rows: { key: string; value: boolean | string; updated_at: string; updated_by: string }[] =
    [];

  if (patch.demoModeEnabled !== undefined) {
    rows.push({
      key: PLATFORM_SETTING_KEYS.demoMode,
      value: patch.demoModeEnabled,
      updated_at: now,
      updated_by: session.profileId,
    });
  }
  if (patch.fixedOtpEnabled !== undefined) {
    rows.push({
      key: PLATFORM_SETTING_KEYS.fixedOtp,
      value: patch.fixedOtpEnabled,
      updated_at: now,
      updated_by: session.profileId,
    });
  }
  if (patch.fixedOtpCode !== undefined) {
    rows.push({
      key: PLATFORM_SETTING_KEYS.fixedOtpCode,
      value: patch.fixedOtpCode,
      updated_at: now,
      updated_by: session.profileId,
    });
  }

  if (rows.length === 0) {
    const settings = await getPlatformSettings();
    return { status: "success", settings };
  }

  try {
    const { error } = await supabase.from("platform_settings").upsert(rows, {
      onConflict: "key",
    });
    if (error) {
      logAuthFailure("PLATFORM_SETTINGS_UPSERT_FAILED", error);
      return { status: "error", message: PLATFORM_SETTINGS_MESSAGES.saveError };
    }

    const settings = await refreshPlatformSettings();
    revalidatePath("/login");
    revalidatePath("/admin/settings");
    revalidatePath("/join", "layout");
    return { status: "success", settings };
  } catch (error) {
    logAuthFailure("PLATFORM_SETTINGS_UPSERT_FAILED", error);
    return { status: "error", message: PLATFORM_SETTINGS_MESSAGES.saveError };
  }
}
