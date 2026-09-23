import { describe, expect, it } from "vitest";
import { shouldUseQuizImmersiveChrome } from "@/lib/student-chrome";

const FEATURE = "[UI-001]";

describe(`${FEATURE} student chrome during loading vs quiz player`, () => {
  it("keeps hub chrome while the quiz player is not mounted (route loading)", () => {
    expect(shouldUseQuizImmersiveChrome(false)).toBe(false);
  });

  it("enters immersive chrome only after QuizRunner mounts", () => {
    expect(shouldUseQuizImmersiveChrome(true)).toBe(true);
  });
});
