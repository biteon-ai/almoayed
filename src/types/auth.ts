export type LoginState =
  | { status: "success"; role: "TEACHER" | "STUDENT" }
  | { status: "needs_verification"; verificationUrl: string; message: string }
  | { status: "error"; message: string };
