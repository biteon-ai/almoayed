import { describe, expect, it } from "vitest";
import { validateDisplayName } from "@/lib/profile-name";
import { isDeviceSessionValid } from "@/lib/device-session";
import { generateSessionToken } from "@/lib/session-token";
import { canRequestProUpgrade } from "@/lib/tier-upgrade";

const FEATURE = "[PROFILE-001]";

describe(`${FEATURE} display name validation`, () => {
  it("accepts trimmed non-empty names", () => {
    expect(validateDisplayName("  أحمد  ")).toEqual({
      ok: true,
      value: "أحمد",
    });
  });

  it("rejects empty or whitespace-only names", () => {
    expect(validateDisplayName("   ").ok).toBe(false);
    expect(validateDisplayName("").ok).toBe(false);
  });

  it("rejects names longer than 100 characters", () => {
    const long = "ا".repeat(101);
    expect(validateDisplayName(long).ok).toBe(false);
  });
});

describe(`${FEATURE} session token rotation (AUTH-003)`, () => {
  it("new token invalidates previous device session", () => {
    const oldToken = generateSessionToken();
    const newToken = generateSessionToken();
    expect(isDeviceSessionValid(oldToken, newToken)).toBe(false);
    expect(isDeviceSessionValid(newToken, newToken)).toBe(true);
  });
});

describe(`${FEATURE} Pro upgrade eligibility`, () => {
  it("free tier without pending request can request upgrade", () => {
    expect(
      canRequestProUpgrade({ tier: "free", upgrade_requested: false })
    ).toBe(true);
  });

  it("pending request blocks duplicate upgrade", () => {
    expect(
      canRequestProUpgrade({ tier: "free", upgrade_requested: true })
    ).toBe(false);
  });
});
