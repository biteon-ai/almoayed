import { describe, expect, it } from "vitest";
import {
  buildTrialJoinAbsoluteUrl,
  buildTrialJoinPath,
  buildTrialInviteShareUrl,
  canSkipOtp,
  normalizeTeacherJoinCode,
  teacherCodesMatch,
  validateTrialJoinForm,
} from "@/lib/trial-join";

const FEATURE = "[AUTH-008]";

describe(`${FEATURE} trial join helpers`, () => {
  it("buildTrialJoinPath encodes teacher code", () => {
    expect(buildTrialJoinPath("AlMoayed-DEMO")).toBe(
      "/join/AlMoayed-DEMO"
    );
  });

  it("buildTrialJoinAbsoluteUrl uses APP_URL origin", () => {
    expect(
      buildTrialJoinAbsoluteUrl("AlMoayed-DEMO", "https://example.com")
    ).toBe("https://example.com/join/AlMoayed-DEMO");
  });

  it("canSkipOtp is true only when profile does not exist", () => {
    expect(canSkipOtp(false)).toBe(true);
    expect(canSkipOtp(true)).toBe(false);
  });

  it("validateTrialJoinForm accepts valid fields", () => {
    const result = validateTrialJoinForm({
      firstName: "أحمد",
      lastName: "علي",
      educationStage: "baccalaureate",
      birthDate: "2010-05-01",
      whatsappNumber: "963987654321",
    });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.fullName).toBe("أحمد علي");
      expect(result.whatsapp).toBe("963987654321");
    }
  });

  it("validateTrialJoinForm rejects missing stage", () => {
    const result = validateTrialJoinForm({
      firstName: "أ",
      lastName: "ب",
      educationStage: "",
      birthDate: "2010-05-01",
      whatsappNumber: "963987654321",
    });
    expect(result.ok).toBe(false);
  });

  it("teacherCodesMatch is case-insensitive", () => {
    expect(teacherCodesMatch("AlMoayed-DEMO", " almoayed-demo ")).toBe(true);
  });

  it("normalizeTeacherJoinCode trims whitespace", () => {
    expect(normalizeTeacherJoinCode("  ABC  ")).toBe("ABC");
  });
});

describe(`${FEATURE} invite share`, () => {
  it("buildTrialInviteShareUrl produces WhatsApp href", () => {
    const { whatsappHref, text } = buildTrialInviteShareUrl({
      teacherName: "أستاذ",
      joinUrl: "https://app.test/join/DEMO",
    });
    expect(text).toContain("https://app.test/join/DEMO");
    expect(whatsappHref).toMatch(/^https:\/\/api\.whatsapp\.com\/send\?text=/);
  });
});
