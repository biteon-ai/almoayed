import { describe, expect, it } from "vitest";
import {
  extractQuizSettingsHeader,
  mapLmsQuizType,
  settingsToQuizFlags,
} from "@/lib/import-text";

const FEATURE = "[TEACH-014]";

describe(`${FEATURE} LMS settings`, () => {
  it("maps quiz types to assessment categories", () => {
    expect(mapLmsQuizType("Practice / Homework")).toBe("practice");
    expect(mapLmsQuizType("Assessment Quiz")).toBe("evaluation");
    expect(mapLmsQuizType("Challenge / Competition")).toBe("challenge");
    expect(mapLmsQuizType("unknown-xyz")).toBeNull();
  });

  it("parses Unlimited attempts and timer No", () => {
    const text = `=== Quiz Settings ===
Quiz Type: Practice / Homework
Number of Attempts: Unlimited
Enable Timer: No
Quiz Duration: 30

Q1: x
A) 1
B) 2
C) 3
D) 4
Answer: A`;

    const { settings } = extractQuizSettingsHeader(text);
    expect(settings?.assessment_category).toBe("practice");
    expect(settings?.max_attempts).toBe(0);
    expect(settings?.is_timed).toBe(false);
    expect(settings?.duration_minutes).toBeNull();

    const { flags, applied } = settingsToQuizFlags(settings!);
    expect(flags.assessment_category).toBe("practice");
    expect(flags.max_attempts).toBe(0);
    expect(flags.is_timed).toBe(false);
    expect(applied).toContain("نوع الاختبار");
  });

  it("skips timer when Enable Timer is Yes without duration", () => {
    const text = `=== Quiz Settings ===
Quiz Type: Assessment Quiz
Enable Timer: Yes
Number of Attempts: 2

Q1: x
A) 1
B) 2
C) 3
D) 4
Answer: A`;

    const { settings } = extractQuizSettingsHeader(text);
    expect(settings?.assessment_category).toBe("evaluation");
    expect(settings?.max_attempts).toBe(2);
    expect(settings?.is_timed).toBeNull();
    expect(settings?.timer_error).toBeTruthy();

    const { flags, applied, skipped } = settingsToQuizFlags(settings!);
    expect(flags.is_timed).toBeUndefined();
    expect(flags.assessment_category).toBe("evaluation");
    expect(flags.max_attempts).toBe(2);
    expect(applied).toContain("نوع الاختبار");
    expect(skipped).toContain("التوقيت");
  });

  it("rejects out-of-range duration for timer Yes", () => {
    const text = `=== Quiz Settings ===
Enable Timer: Yes
Quiz Duration: 999

=== Quiz Questions ===`;

    const { settings } = extractQuizSettingsHeader(text);
    expect(settings?.is_timed).toBeNull();
    expect(settings?.timer_error).toBeTruthy();
    const { flags, skipped } = settingsToQuizFlags(settings!);
    expect(flags.is_timed).toBeUndefined();
    expect(skipped).toContain("التوقيت");
  });
});
