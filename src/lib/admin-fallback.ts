import { timingSafeEqual } from "crypto";
import { normalizeWhatsAppNumber } from "@/lib/constants";

export function getAdminFallbackSecret(): string {
  return (
    process.env.ADMIN_FALLBACK_SECRET?.trim() ||
    process.env.ADMIN_FALLBACK_KEY?.trim() ||
    process.env.ADMIN_SECRET?.trim() ||
    ""
  );
}

export function getAdminWhatsAppAllowlist(): string[] {
  const raw = process.env.ADMIN_WHATSAPP_ALLOWLIST?.trim() ?? "";
  if (!raw) return [];
  return raw
    .split(",")
    .map((n) => normalizeWhatsAppNumber(n.trim()))
    .filter(Boolean);
}

export function isAdminWhatsAppAllowed(whatsappNumber: string): boolean {
  const normalized = normalizeWhatsAppNumber(whatsappNumber);
  return getAdminWhatsAppAllowlist().includes(normalized);
}

/** Constant-time compare; false if either side empty or lengths differ. */
export function verifyAdminFallbackSecret(submitted: string): boolean {
  const expected = getAdminFallbackSecret();
  if (!expected || !submitted) return false;

  const a = Buffer.from(submitted);
  const b = Buffer.from(expected);
  if (a.length !== b.length) {
    // Still run a compare to reduce timing leakage on length
    timingSafeEqual(a, Buffer.alloc(a.length));
    return false;
  }
  return timingSafeEqual(a, b);
}

export function isAuthDemoBypassEnabled(): boolean {
  if (process.env.AUTH_DEMO_BYPASS === "true") return true;
  if (process.env.AUTH_DEMO_BYPASS === "false") return false;
  return process.env.NODE_ENV !== "production";
}
