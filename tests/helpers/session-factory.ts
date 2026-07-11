import type { SessionData } from "@/lib/session";

export function createStudentSession(
  overrides: Partial<SessionData> = {}
): SessionData {
  return {
    profileId: "student-profile-001",
    whatsappNumber: "963987654321",
    fullName: "أحمد الطالب",
    role: "STUDENT",
    isLoggedIn: true,
    sessionToken: "a".repeat(64),
    currentTeacherId: "teacher-profile-001",
    ...overrides,
  };
}

export function createTeacherSession(
  overrides: Partial<SessionData> = {}
): SessionData {
  return {
    profileId: "teacher-profile-001",
    whatsappNumber: "963912345678",
    fullName: "أستاذ المؤيد",
    role: "TEACHER",
    isLoggedIn: true,
    sessionToken: "b".repeat(64),
    currentTeacherId: null,
    ...overrides,
  };
}
