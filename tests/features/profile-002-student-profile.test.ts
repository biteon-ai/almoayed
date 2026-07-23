import { describe, expect, it } from "vitest";
import {
  isRequiredProfileComplete,
  sanitizeReturnPath,
  shouldBlockNewQuiz,
  validateOnboardingInput,
  EDUCATION_STAGE_LABELS,
  REFERRAL_SOURCE_LABELS,
} from "@/lib/student-profile";

describe("[PROFILE-002] student-profile helpers", () => {
  it("blocks new quizzes only when incomplete + count>=2 + no submission", () => {
    expect(
      shouldBlockNewQuiz({
        profileCompleted: false,
        uniqueCompletedQuizzes: 2,
        hasSubmissionForQuiz: false,
      })
    ).toBe(true);

    expect(
      shouldBlockNewQuiz({
        profileCompleted: false,
        uniqueCompletedQuizzes: 2,
        hasSubmissionForQuiz: true,
      })
    ).toBe(false);

    expect(
      shouldBlockNewQuiz({
        profileCompleted: false,
        uniqueCompletedQuizzes: 1,
        hasSubmissionForQuiz: false,
      })
    ).toBe(false);

    expect(
      shouldBlockNewQuiz({
        profileCompleted: true,
        uniqueCompletedQuizzes: 5,
        hasSubmissionForQuiz: false,
      })
    ).toBe(false);
  });

  it("sanitizes return paths", () => {
    expect(sanitizeReturnPath("/quiz/abc")).toBe("/quiz/abc");
    expect(sanitizeReturnPath("https://evil.com")).toBe("/dashboard");
    expect(sanitizeReturnPath("//evil.com")).toBe("/dashboard");
    expect(sanitizeReturnPath(null)).toBe("/dashboard");
  });

  it("validates required profile completeness", () => {
    expect(
      isRequiredProfileComplete({
        fullName: "طالب",
        birthDate: "2005-01-15",
        province: "دمشق",
        city: "المزة",
        educationStage: "baccalaureate",
      })
    ).toBe(true);

    expect(
      isRequiredProfileComplete({
        fullName: "طالب",
        birthDate: "2005-01-15",
        province: "دمشق",
        city: "",
        educationStage: "baccalaureate",
      })
    ).toBe(false);
  });

  it("validates onboarding input", () => {
    expect(
      validateOnboardingInput({
        educationStage: "university",
        referralSource: "whatsapp",
        primarySubject: "رياضيات",
      }).ok
    ).toBe(true);

    expect(
      validateOnboardingInput({
        educationStage: "nope",
        referralSource: "whatsapp",
        primarySubject: "رياضيات",
      }).ok
    ).toBe(false);
  });

  it("exposes Arabic labels for stages and referrals", () => {
    expect(EDUCATION_STAGE_LABELS.baccalaureate).toContain("بكالوريا");
    expect(REFERRAL_SOURCE_LABELS.class).toContain("المعهد");
  });

  it("treats invalid email as incomplete when provided", () => {
    expect(
      isRequiredProfileComplete({
        fullName: "طالب",
        birthDate: "2005-01-15",
        province: "دمشق",
        city: "المزة",
        educationStage: "baccalaureate",
        email: "bad",
      })
    ).toBe(false);
  });
});
