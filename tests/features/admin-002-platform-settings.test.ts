import { describe, expect, it } from "vitest";
import {
  codesMatch,
  isFixedOtpUsableFromSettings,
  isValidFixedOtpCode,
  parseFixedOtpCode,
  parsePlatformSettingsRows,
  PLATFORM_SETTING_KEYS,
  validateFixedOtpCode,
} from "@/lib/platform-settings";

const FEATURE = "[ADMIN-002]";

describe(`${FEATURE} platform settings helpers`, () => {
  it("parses seed rows with demo on and fixed OTP off", () => {
    const settings = parsePlatformSettingsRows(
      [
        { key: PLATFORM_SETTING_KEYS.demoMode, value: true },
        { key: PLATFORM_SETTING_KEYS.fixedOtp, value: false },
        { key: PLATFORM_SETTING_KEYS.fixedOtpCode, value: "123456" },
      ],
      false
    );
    expect(settings.demoModeEnabled).toBe(true);
    expect(settings.fixedOtpEnabled).toBe(false);
    expect(settings.fixedOtpCode).toBe("123456");
  });

  it("uses env fallback for Demo Mode when the row is missing", () => {
    const settings = parsePlatformSettingsRows([], true);
    expect(settings.demoModeEnabled).toBe(true);
    expect(settings.fixedOtpEnabled).toBe(false);
    expect(isFixedOtpUsableFromSettings(settings)).toBe(false);
  });

  it("treats DB Demo Mode false as override over env fallback", () => {
    const settings = parsePlatformSettingsRows(
      [{ key: PLATFORM_SETTING_KEYS.demoMode, value: false }],
      true
    );
    expect(settings.demoModeEnabled).toBe(false);
  });

  it("fails closed for Fixed OTP when the store is empty", () => {
    const settings = parsePlatformSettingsRows([], true);
    expect(isFixedOtpUsableFromSettings(settings)).toBe(false);
  });

  it("treats Fixed OTP as unusable when enabled without a valid code", () => {
    expect(
      isFixedOtpUsableFromSettings({
        fixedOtpEnabled: true,
        fixedOtpCode: "",
      })
    ).toBe(false);
    expect(
      isFixedOtpUsableFromSettings({
        fixedOtpEnabled: true,
        fixedOtpCode: "12",
      })
    ).toBe(false);
  });

  it("treats Fixed OTP as usable when enabled with 4–8 digits", () => {
    expect(
      isFixedOtpUsableFromSettings({
        fixedOtpEnabled: true,
        fixedOtpCode: "123456",
      })
    ).toBe(true);
  });

  it("validates fixed OTP codes", () => {
    expect(validateFixedOtpCode("123456").ok).toBe(true);
    expect(validateFixedOtpCode("12").ok).toBe(false);
    expect(validateFixedOtpCode("abcdef").ok).toBe(false);
    expect(isValidFixedOtpCode("654321")).toBe(true);
    expect(parseFixedOtpCode(123456)).toBe("123456");
  });

  it("matches codes in constant time after digit normalize", () => {
    expect(codesMatch("123456", "123456")).toBe(true);
    expect(codesMatch("123-456", "123456")).toBe(true);
    expect(codesMatch("123456", "654321")).toBe(false);
    expect(codesMatch("", "123456")).toBe(false);
  });

  it("rejects the previous code after rotation", () => {
    const previous = "123456";
    const next = "654321";
    expect(codesMatch("123456", previous)).toBe(true);
    expect(codesMatch("123456", next)).toBe(false);
    expect(codesMatch("654321", next)).toBe(true);
    expect(
      isFixedOtpUsableFromSettings({
        fixedOtpEnabled: false,
        fixedOtpCode: next,
      })
    ).toBe(false);
  });
});
