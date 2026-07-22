import { describe, expect, it } from "vitest";
import {
  getAdminWhatsAppAllowlist,
  isAdminWhatsAppAllowed,
  verifyAdminFallbackSecret,
} from "@/lib/admin-fallback";
import { AuthErrorCode } from "@/lib/auth-error-codes";
import { loginMessageForCode } from "@/lib/login-ui-messages";

const FEATURE = "[AUTH-005]";

describe(`${FEATURE} Admin fallback helpers`, () => {
  it("parses allowlist and matches normalized WhatsApp", () => {
    const prev = process.env.ADMIN_WHATSAPP_ALLOWLIST;
    process.env.ADMIN_WHATSAPP_ALLOWLIST = "963912345678, 963999999999";
    try {
      expect(getAdminWhatsAppAllowlist()).toEqual([
        "963912345678",
        "963999999999",
      ]);
      expect(isAdminWhatsAppAllowed("963912345678")).toBe(true);
      expect(isAdminWhatsAppAllowed("+963 912 345 678")).toBe(true);
      expect(isAdminWhatsAppAllowed("963987654321")).toBe(false);
    } finally {
      if (prev === undefined) delete process.env.ADMIN_WHATSAPP_ALLOWLIST;
      else process.env.ADMIN_WHATSAPP_ALLOWLIST = prev;
    }
  });

  it("verifyAdminFallbackSecret uses exact match", () => {
    const prev = process.env.ADMIN_FALLBACK_SECRET;
    process.env.ADMIN_FALLBACK_SECRET = "super-secret-key";
    try {
      expect(verifyAdminFallbackSecret("super-secret-key")).toBe(true);
      expect(verifyAdminFallbackSecret("wrong")).toBe(false);
      expect(verifyAdminFallbackSecret("")).toBe(false);
    } finally {
      if (prev === undefined) delete process.env.ADMIN_FALLBACK_SECRET;
      else process.env.ADMIN_FALLBACK_SECRET = prev;
    }
  });

  it("denial message is generic Arabic (no leak)", () => {
    const msg = loginMessageForCode(AuthErrorCode.ADMIN_FALLBACK_DENIED);
    expect(msg).toContain("تعذر");
    expect(msg).not.toMatch(/allowlist|secret|API/i);
  });
});
