import {
  AuthErrorCode,
  type AuthErrorCode as AuthErrorCodeType,
} from "@/lib/auth-error-codes";

export type LoginState =
  | { status: "success"; role: "TEACHER" | "STUDENT" }
  | { status: "registered"; next: "otp" }
  | { status: "already_registered" }
  | { status: "redirect"; redirectUrl: string }
  | { status: "needs_teacher_link" }
  | {
      status: "needs_verification";
      verificationUrl: string;
      code: typeof AuthErrorCode.ACCOUNT_PENDING_VERIFICATION;
    }
  | { status: "error"; code: AuthErrorCodeType };
