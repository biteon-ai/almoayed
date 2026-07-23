import { describe, expect, it } from "vitest";
import {
  generateSecurePassword,
  isValidEmail,
  hashPassword,
  verifyPassword,
} from "@/lib/admin/passwords";
import { isSuperAdminSession } from "@/lib/admin/require-super-admin";
import type { SessionData } from "@/lib/session";

const FEATURE = "[ADMIN-001]";

describe(`${FEATURE} admin helpers`, () => {
  it("validates email format", () => {
    expect(isValidEmail("admin@school.sy")).toBe(true);
    expect(isValidEmail("bad")).toBe(false);
  });

  it("generates passwords with minimum length", () => {
    expect(generateSecurePassword(12).length).toBe(12);
  });

  it("hashes and verifies passwords", async () => {
    const hash = await hashPassword("secret1234");
    expect(await verifyPassword("secret1234", hash)).toBe(true);
    expect(await verifyPassword("wrong", hash)).toBe(false);
  });

  it("detects super admin session", () => {
    const session: SessionData = {
      profileId: "1",
      whatsappNumber: "",
      fullName: "Admin",
      role: "SUPER_ADMIN",
      isLoggedIn: true,
      sessionToken: "t",
      currentTeacherId: null,
      pendingTeacherLink: false,
    };
    expect(isSuperAdminSession(session)).toBe(true);

    session.impersonation = {
      adminProfileId: "1",
      adminRole: "SUPER_ADMIN",
      teacherId: "2",
      teacherName: "Teacher",
      startedAt: new Date().toISOString(),
    };
    expect(isSuperAdminSession(session)).toBe(false);
  });
});
