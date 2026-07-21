import { describe, expect, it } from "vitest";
import { AuthErrorCode } from "@/lib/auth-error-codes";
import { loginMessageForCode } from "@/lib/login-ui-messages";

const FEATURE = "[AUTH-002]";

describe(`${FEATURE} Registration messaging`, () => {
  it("already-registered steers user to OTP in Arabic", () => {
    const msg = loginMessageForCode(AuthErrorCode.ALREADY_REGISTERED);
    expect(msg).toContain("حساب");
    expect(msg.toLowerCase()).toMatch(/otp|واتساب/);
  });

  it("missing full name has clear Arabic copy", () => {
    expect(loginMessageForCode(AuthErrorCode.MISSING_FULL_NAME)).toContain(
      "اسمك"
    );
  });

  it("register-required after OTP without profile", () => {
    expect(loginMessageForCode(AuthErrorCode.REGISTER_REQUIRED)).toContain(
      "رمز الأستاذ"
    );
  });
});
