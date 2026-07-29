import {
  getBiteonSwitchConfig,
  isBiteonSwitchConfigured,
} from "@/lib/biteonswitch/config";
import type {
  HostedLoginParams,
  VerifyCallbackInput,
  VerifyResult,
} from "@/lib/biteonswitch/types";
import { normalizeWhatsAppNumber } from "@/lib/constants";

const OTP_STATE_TTL_MS = 15 * 60 * 1000;

export function isOtpStateExpired(createdAt: string | Date): boolean {
  const created =
    typeof createdAt === "string" ? new Date(createdAt).getTime() : createdAt.getTime();
  if (Number.isNaN(created)) return true;
  return Date.now() - created > OTP_STATE_TTL_MS;
}

export function roleHomePath(role: "TEACHER" | "STUDENT"): string {
  return role === "TEACHER" ? "/teacher/dashboard" : "/dashboard";
}

/** Decode JWT payload (no signature check) — hosted return tokens. */
export function decodeJwtPayload(
  token: string
): Record<string, unknown> | null {
  try {
    const parts = token.split(".");
    if (parts.length < 2) return null;
    const b64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const pad = b64.length % 4 === 0 ? "" : "=".repeat(4 - (b64.length % 4));
    const json = Buffer.from(b64 + pad, "base64").toString("utf8");
    const payload = JSON.parse(json) as Record<string, unknown>;
    return payload && typeof payload === "object" ? payload : null;
  } catch {
    return null;
  }
}

/** Phone digits from federation JWT (`phone` / `whatsapp_number`). */
export function whatsappFromBiteonToken(token: string): string | null {
  const trimmed = token.trim();
  if (!trimmed) return null;

  if (trimmed.startsWith("mock:")) {
    const digits = normalizeWhatsAppNumber(trimmed.slice("mock:".length));
    return digits.length >= 10 && digits.length <= 15 ? digits : null;
  }

  const payload = decodeJwtPayload(trimmed);
  if (!payload) return null;

  const exp = typeof payload.exp === "number" ? payload.exp : null;
  if (exp != null && exp * 1000 < Date.now()) return null;

  const rawPhone =
    (typeof payload.phone === "string" && payload.phone) ||
    (typeof payload.whatsapp_number === "string" && payload.whatsapp_number) ||
    "";
  const digits = normalizeWhatsAppNumber(rawPhone);
  return digits.length >= 10 && digits.length <= 15 ? digits : null;
}

/**
 * Build BiteonSwitch hosted login URL.
 * Mock mode: bounce straight to our callback with token mock:<whatsappHint>.
 */
export function buildHostedLoginUrl(params: HostedLoginParams): string | null {
  const config = getBiteonSwitchConfig();
  if (!isBiteonSwitchConfigured(config)) return null;

  if (config.mock) {
    const hint = params.whatsappHint
      ? normalizeWhatsAppNumber(params.whatsappHint)
      : "";
    if (!hint) return null;
    const url = new URL(config.callbackUrl);
    url.searchParams.set("token", `mock:${hint}`);
    url.searchParams.set("state", params.state);
    return url.toString();
  }

  const base =
    config.hostedLoginUrl ||
    (config.apiBaseUrl
      ? `${config.apiBaseUrl.replace(/\/$/, "")}/hosted-login`
      : null);
  if (!base) return null;

  const url = new URL(base);
  url.searchParams.set("app_id", config.appId);
  url.searchParams.set("callback_url", config.callbackUrl);
  url.searchParams.set("state", params.state);
  if (params.whatsappHint) {
    url.searchParams.set(
      "whatsapp",
      normalizeWhatsAppNumber(params.whatsappHint)
    );
  }
  return url.toString();
}

export async function verifyCallbackToken(
  input: VerifyCallbackInput
): Promise<VerifyResult> {
  const config = getBiteonSwitchConfig();
  if (!isBiteonSwitchConfigured(config)) {
    return { ok: false, reason: "config" };
  }

  if (config.mock) {
    if (!input.token.startsWith("mock:")) {
      return { ok: false, reason: "invalid" };
    }
    const whatsappNumber = normalizeWhatsAppNumber(input.token.slice("mock:".length));
    if (whatsappNumber.length < 10 || whatsappNumber.length > 15) {
      return { ok: false, reason: "invalid" };
    }
    return {
      ok: true,
      whatsappNumber,
      providerRef: `mock:${input.state}`,
    };
  }

  if (!config.apiBaseUrl || !config.apiKey) {
    return { ok: false, reason: "config" };
  }

  try {
    const res = await fetch(
      `${config.apiBaseUrl.replace(/\/$/, "")}/v1/otp/verify`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${config.apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          token: input.token,
          app_id: config.appId,
          state: input.state,
        }),
        signal: AbortSignal.timeout(15_000),
      }
    );

    if (!res.ok) {
      return {
        ok: false,
        reason: res.status >= 500 ? "unavailable" : "invalid",
      };
    }

    const body = (await res.json()) as {
      ok?: boolean;
      whatsapp_number?: string;
      provider_ref?: string;
    };

    if (!body.ok || !body.whatsapp_number) {
      return { ok: false, reason: "invalid" };
    }

    const whatsappNumber = normalizeWhatsAppNumber(body.whatsapp_number);
    if (whatsappNumber.length < 10 || whatsappNumber.length > 15) {
      return { ok: false, reason: "invalid" };
    }

    return {
      ok: true,
      whatsappNumber,
      providerRef: body.provider_ref,
    };
  } catch {
    return { ok: false, reason: "unavailable" };
  }
}
