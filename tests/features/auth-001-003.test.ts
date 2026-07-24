import { describe, expect, it } from "vitest";
import {
  DEMO_STUDENT,
  DEMO_TEACHER,
  normalizeWhatsAppNumber,
} from "@/lib/constants";
import { isDeviceSessionValid } from "@/lib/device-session";
import { generateSessionToken } from "@/lib/session-token";

const FEATURE_LOGIN = "[AUTH-001]";
const FEATURE_LOCK = "[AUTH-003]";

describe(`${FEATURE_LOGIN} WhatsApp login normalization`, () => {
  it("strips non-digits from WhatsApp input", () => {
    expect(normalizeWhatsAppNumber("+963 987 654 321")).toBe("963987654321");
    expect(normalizeWhatsAppNumber("00963987654321")).toBe("00963987654321");
  });

  it("demo accounts match seeded constants", () => {
    expect(DEMO_STUDENT.whatsapp_number).toBe("963987654321");
    expect(DEMO_TEACHER.whatsapp_number).toBe("963912345678");
    expect(DEMO_TEACHER.teacher_code).toBe("AlMoayed-DEMO");
  });
});

describe(`${FEATURE_LOCK} Device concurrency lock`, () => {
  it("generateSessionToken produces 64-char hex token", () => {
    const token = generateSessionToken();
    expect(token).toMatch(/^[a-f0-9]{64}$/);
    expect(token).not.toBe(generateSessionToken());
  });

  it("valid when session token matches profiles.last_session_id", () => {
    const token = "abc123";
    expect(isDeviceSessionValid(token, token)).toBe(true);
  });

  it("invalid when another device logged in (token mismatch)", () => {
    expect(isDeviceSessionValid("session-a", "session-b")).toBe(false);
  });

  it("allows legacy sessions without sessionToken", () => {
    expect(isDeviceSessionValid(undefined, "any-value")).toBe(true);
  });

  it("allows when last_session_id is unset", () => {
    expect(isDeviceSessionValid("token", null)).toBe(true);
    expect(isDeviceSessionValid("token", undefined)).toBe(true);
  });
});

describe(`[FIX-AUTH-001] Demo WhatsApp constants for device-lock bypass`, () => {
  it("keeps seeded demo numbers stable for AUTH_DEMO_BYPASS skip path", () => {
    expect(DEMO_STUDENT.whatsapp_number).toBe("963987654321");
    expect(DEMO_TEACHER.whatsapp_number).toBe("963912345678");
  });
});
