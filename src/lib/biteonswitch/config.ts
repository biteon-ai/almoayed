import type { BiteonSwitchConfig } from "@/lib/biteonswitch/types";
import { APP_URL } from "@/lib/constants";

export function isBiteonSwitchMockEnabled(): boolean {
  if (process.env.BITEONSWITCH_MOCK === "true") return true;
  if (process.env.BITEONSWITCH_MOCK === "false") return false;
  // Auto-mock when API key missing outside production
  return (
    process.env.NODE_ENV !== "production" && !process.env.BITEONSWITCH_API_KEY
  );
}

export function getBiteonSwitchConfig(): BiteonSwitchConfig {
  const callbackUrl =
    process.env.BITEONSWITCH_CALLBACK_URL?.trim() ||
    `${APP_URL}/api/auth/biteonswitch/callback`;

  return {
    apiKey: process.env.BITEONSWITCH_API_KEY?.trim() ?? "",
    appId: process.env.BITEONSWITCH_APP_ID?.trim() ?? "",
    callbackUrl,
    hostedLoginUrl: process.env.BITEONSWITCH_HOSTED_LOGIN_URL?.trim() || null,
    apiBaseUrl: process.env.BITEONSWITCH_API_BASE_URL?.trim() || null,
    mock: isBiteonSwitchMockEnabled(),
  };
}

export function isBiteonSwitchConfigured(config = getBiteonSwitchConfig()): boolean {
  if (config.mock) return true;
  return Boolean(config.apiKey && config.appId && config.callbackUrl);
}
