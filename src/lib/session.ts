import { SessionOptions } from "iron-session";
import type { UserRole } from "@/types/database";

export interface SessionData {
  profileId: string;
  whatsappNumber: string;
  fullName: string;
  role: UserRole;
  isLoggedIn: boolean;
  /** Device-lock token — must match profiles.last_session_id */
  sessionToken: string;
  /** Active teacher context for multi-tenant students */
  currentTeacherId: string | null;
  /**
   * OTP verified but student has no teacher link yet.
   * Not a full login — must complete رمز الأستاذ before isLoggedIn.
   */
  pendingTeacherLink: boolean;
}

export const defaultSession: SessionData = {
  profileId: "",
  whatsappNumber: "",
  fullName: "",
  role: "STUDENT",
  isLoggedIn: false,
  sessionToken: "",
  currentTeacherId: null,
  pendingTeacherLink: false,
};

export const sessionOptions: SessionOptions = {
  password:
    process.env.SESSION_SECRET ??
    "complex_password_at_least_32_characters_long_dev_only",
  cookieName: "almoayed_session",
  cookieOptions: {
    secure: process.env.NODE_ENV === "production",
    httpOnly: true,
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 30,
  },
};
