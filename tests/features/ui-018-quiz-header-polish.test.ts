import { describe, expect, it } from "vitest";
import { remainingTimeFraction } from "@/lib/quiz-timer";

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
