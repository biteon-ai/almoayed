import { timingSafeEqual } from "crypto";
import { isAuthDemoBypassEnabled } from "@/lib/admin-fallback";
import { getAuthSupabaseClient } from "@/lib/auth-session";
import { PLATFORM_SETTINGS_MESSAGES } from "@/lib/platform-settings-messages";
import { requestCache } from "@/lib/request-cache";

export const PLATFORM_SETTING_KEYS = {
  demoMode: "demo_mode_enabled",
  fixedOtp: "fixed_otp_enabled",
  fixedOtpCode: "fixed_otp_code",
} as const;

export type PlatformSettings = {
  demoModeEnabled: boolean;
  fixedOtpEnabled: boolean;
  fixedOtpCode: string;
};

export type PlatformSettingsRow = {
  key: string;
  value: unknown;
};

function parseJsonbBoolean(value: unknown, fallback: boolean): boolean {
  if (typeof value === "boolean") return value;
  if (value === "true") return true;
  if (value === "false") return false;
  return fallback;
}

function digitsOnly(value: string): string {
  return value.replace(/\D/g, "");
}

export function parseFixedOtpCode(value: unknown): string {
  if (typeof value === "number" && Number.isInteger(value)) {
    return String(value);
  }
  if (typeof value === "string") {
    return digitsOnly(value);
  }
  return "";
}

export function isValidFixedOtpCode(code: string): boolean {
  return /^\d{4,8}$/.test(code);
}

export function validateFixedOtpCode(
  raw: string
): { ok: true; value: string } | { ok: false; message: string } {
  const value = digitsOnly(raw.trim());
  if (!isValidFixedOtpCode(value)) {
    return { ok: false, message: PLATFORM_SETTINGS_MESSAGES.invalidCode };
  }
  return { ok: true, value };
}

export function codesMatch(submitted: string, expected: string): boolean {
  const a = digitsOnly(submitted);
  const b = digitsOnly(expected);
  if (!a || !b || a.length !== b.length) return false;
  return timingSafeEqual(Buffer.from(a), Buffer.from(b));
}

export function parsePlatformSettingsRows(
  rows: PlatformSettingsRow[],
  demoFallback: boolean
): PlatformSettings {
  const byKey = new Map(rows.map((row) => [row.key, row.value]));
  const hasDemoRow = byKey.has(PLATFORM_SETTING_KEYS.demoMode);
  const demoRaw = byKey.get(PLATFORM_SETTING_KEYS.demoMode);
  const demoModeEnabled = hasDemoRow
    ? parseJsonbBoolean(demoRaw, false)
    : demoFallback;

  return {
    demoModeEnabled,
    fixedOtpEnabled: parseJsonbBoolean(
      byKey.get(PLATFORM_SETTING_KEYS.fixedOtp),
      false
    ),
    fixedOtpCode: parseFixedOtpCode(byKey.get(PLATFORM_SETTING_KEYS.fixedOtpCode)),
  };
}

export function isFixedOtpUsableFromSettings(
  settings: Pick<PlatformSettings, "fixedOtpEnabled" | "fixedOtpCode">
): boolean {
  return settings.fixedOtpEnabled && isValidFixedOtpCode(settings.fixedOtpCode);
}

async function fetchPlatformSettings(): Promise<PlatformSettings> {
  const demoFallback = isAuthDemoBypassEnabled();
  const supabase = getAuthSupabaseClient();
  if (!supabase) {
    return parsePlatformSettingsRows([], demoFallback);
  }

  try {
    const { data, error } = await supabase
      .from("platform_settings")
      .select("key, value")
      .in("key", [
        PLATFORM_SETTING_KEYS.demoMode,
        PLATFORM_SETTING_KEYS.fixedOtp,
        PLATFORM_SETTING_KEYS.fixedOtpCode,
      ]);

    if (error || !data) {
      return parsePlatformSettingsRows([], demoFallback);
    }

    return parsePlatformSettingsRows(data, demoFallback);
  } catch {
    return parsePlatformSettingsRows([], demoFallback);
  }
}

const loadPlatformSettings = requestCache(fetchPlatformSettings);

export async function getPlatformSettings(): Promise<PlatformSettings> {
  return loadPlatformSettings();
}

/** Bypass request memoization after an admin write in the same request. */
export async function refreshPlatformSettings(): Promise<PlatformSettings> {
  return fetchPlatformSettings();
}

export async function isDemoModeEnabled(): Promise<boolean> {
  // Playwright webServer only — AUTH-001/FIX-AUTH-001 demo shortcuts stay
  // available even when the live platform_settings row is off.
  if (process.env.E2E_FORCE_DEMO_MODE === "true") return true;
  const settings = await getPlatformSettings();
  return settings.demoModeEnabled;
}

export async function isFixedOtpUsable(): Promise<boolean> {
  const settings = await getPlatformSettings();
  return isFixedOtpUsableFromSettings(settings);
}
