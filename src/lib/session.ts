import { SessionOptions } from "iron-session";
import type { UserRole } from "@/types/database";

export interface SessionData {
  profileId: string;
  whatsappNumber: string;
  fullName: string;
  role: UserRole;
  isLoggedIn: boolean;
}

export const defaultSession: SessionData = {
  profileId: "",
  whatsappNumber: "",
  fullName: "",
  role: "STUDENT",
  isLoggedIn: false,
};

export const sessionOptions: SessionOptions = {
  password: process.env.SESSION_SECRET ?? "complex_password_at_least_32_characters_long_dev_only",
  cookieName: "almoayed_session",
  cookieOptions: {
    secure: process.env.NODE_ENV === "production",
    httpOnly: true,
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 30, // 30 days
  },
};
