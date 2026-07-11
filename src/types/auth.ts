import {
  AuthErrorCode,
  type AuthErrorCode as AuthErrorCodeType,
} from "@/lib/auth-error-codes";

export type LoginState =
  | { status: "success"; role: "TEACHER" | "STUDENT" }
  | {
      status: "needs_verification";
      verificationUrl: string;
      code: typeof AuthErrorCode.ACCOUNT_PENDING_VERIFICATION;
    }
  | { status: "error"; code: AuthErrorCodeType };
