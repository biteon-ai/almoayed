import { describe, expect, it } from "vitest";
import { remainingTimeFraction, timerProgressTone } from "@/lib/quiz-timer";

const FEATURE = "[UI-018]";

describe(`${FEATURE} remainingTimeFraction`, () => {
  it("is 1 at the start of a timed attempt", () => {
    expect(remainingTimeFraction(600, 10)).toBe(1);
  });

  it("is 0.5 at the midpoint of the attempt duration", () => {
    expect(remainingTimeFraction(300, 10)).toBe(0.5);
  });

  it("is 0.2 when 120 seconds remain of a 10-minute attempt", () => {
    expect(remainingTimeFraction(120, 10)).toBe(0.2);
  });

  it("is 0 at expiry", () => {
    expect(remainingTimeFraction(0, 10)).toBe(0);
  });

  it("is 0 when durationMinutes is not positive", () => {
    expect(remainingTimeFraction(50, 0)).toBe(0);
    expect(remainingTimeFraction(50, -5)).toBe(0);
  });

  it("clamps leftover ticks above the attempt duration and ignores answered-count", () => {
    expect(remainingTimeFraction(9999, 10)).toBe(1);
    expect(remainingTimeFraction(-3, 10)).toBe(0);
  });
});

describe(`${FEATURE} timerProgressTone`, () => {
  it("is green above 50% remaining", () => {
    expect(timerProgressTone(301, 10)).toBe("green");
    expect(timerProgressTone(600, 10)).toBe("green");
  });

  it("is amber from 20% through 50% remaining", () => {
    expect(timerProgressTone(300, 10)).toBe("amber");
    expect(timerProgressTone(180, 10)).toBe("amber");
    expect(timerProgressTone(120, 10)).toBe("amber");
  });

  it("is red below 20% remaining", () => {
    expect(timerProgressTone(119, 10)).toBe("red");
    expect(timerProgressTone(90, 10)).toBe("red");
  });

  it("is red in the last 60 seconds even when % is still above 20", () => {
    // 3-minute quiz: 60s ≈ 33% (>20%) but critical floor applies
    expect(timerProgressTone(60, 3)).toBe("red");
    expect(timerProgressTone(61, 3)).toBe("amber");
  });

  it("is red when expired", () => {
    expect(timerProgressTone(0, 10)).toBe("red");
    expect(timerProgressTone(-1, 10)).toBe("red");
  });
});
