import { describe, expect, it } from "vitest";
import { AuthErrorCode } from "@/lib/auth-error-codes";
import { loginMessageForCode } from "@/lib/login-ui-messages";

describe("[AUTH-001] login error code mapping", () => {
  it("maps English server codes to Arabic UI strings", () => {
    expect(loginMessageForCode(AuthErrorCode.INVALID_TEACHER_CODE)).toContain(
      "رمز الأستاذ"
    );
    expect(loginMessageForCode(AuthErrorCode.SUPABASE_CONNECTION_ERROR)).toContain(
      "الاتصال"
    );
  });

  it("falls back for unknown codes", () => {
    expect(loginMessageForCode("UNKNOWN_CODE")).toBe(
      loginMessageForCode(AuthErrorCode.LOGIN_UNEXPECTED)
    );
  });

  it("server codes are ASCII-only (Flight-safe)", () => {
    for (const code of Object.values(AuthErrorCode)) {
      expect(code).toMatch(/^[A-Z0-9_]+$/);
      expect(code).not.toMatch(/[\u0600-\u06FF]/);
    }
  });
});
