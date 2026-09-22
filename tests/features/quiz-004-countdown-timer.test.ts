import { describe, expect, it } from "vitest";
import {
  assertTimedSessionAllowsMutation,
  computeRemainingSeconds,
  formatRemainingMmSs,
  isWarningRemaining,
  padAnswersForQuestions,
  remainingSecondsFromEndsAt,
  remainingSecondsMonotonic,
  shouldReuseTimedSession,
  timedSessionViewFromRow,
  validateDurationMinutes,
} from "@/lib/quiz-timer";

const FEATURE = "[QUIZ-004]";

describe(`${FEATURE} duration validation`, () => {
  it("accepts 1–180 inclusive", () => {
    expect(validateDurationMinutes(1)).toEqual({ ok: true, value: 1 });
    expect(validateDurationMinutes(180)).toEqual({ ok: true, value: 180 });
    expect(validateDurationMinutes("30")).toEqual({ ok: true, value: 30 });
  });

  it("rejects 0, 181, and non-integers", () => {
    expect(validateDurationMinutes(0).ok).toBe(false);
    expect(validateDurationMinutes(181).ok).toBe(false);
    expect(validateDurationMinutes(1.5).ok).toBe(false);
    expect(validateDurationMinutes("abc").ok).toBe(false);
  });

  it("untimed clears duration via validate only when timed path used", () => {
    // Contract: untimed persist is_timed=false, duration_minutes=null (action layer)
    expect(validateDurationMinutes(null).ok).toBe(false);
  });
});

describe(`${FEATURE} display + remaining math`, () => {
  it("formats MM:SS with minutes >= 60", () => {
    expect(formatRemainingMmSs(0)).toBe("00:00");
    expect(formatRemainingMmSs(65)).toBe("01:05");
    expect(formatRemainingMmSs(125 * 60 + 5)).toBe("125:05");
  });

  it("warns at <= 120 seconds remaining", () => {
    expect(isWarningRemaining(120)).toBe(true);
    expect(isWarningRemaining(121)).toBe(false);
    expect(isWarningRemaining(0)).toBe(false);
  });

  it("computes remaining from startedAt + duration", () => {
    const started = new Date("2026-07-24T10:00:00.000Z");
    const now = new Date("2026-07-24T10:01:30.000Z");
    expect(computeRemainingSeconds(started, 5, now)).toBe(210);
  });

  it("remainingSecondsFromEndsAt is refresh-safe", () => {
    const endsAt = "2026-07-24T10:05:00.000Z";
    const now = new Date("2026-07-24T10:04:10.000Z");
    expect(remainingSecondsFromEndsAt(endsAt, now)).toBe(50);
    expect(
      remainingSecondsFromEndsAt(endsAt, new Date("2026-07-24T10:06:00.000Z"))
    ).toBe(0);
  });

  it("uses stored ends_at as absolute expiry source of truth", () => {
    const view = timedSessionViewFromRow(
      {
        started_at: "2026-07-24T10:00:00.000Z",
        duration_minutes: 5,
        ends_at: "2026-07-24T10:05:00.000Z",
        used_attempts_at_start: 0,
      },
      new Date("2026-07-24T10:02:00.000Z")
    );
    expect(view.endsAt).toBe("2026-07-24T10:05:00.000Z");
    expect(view.remainingSeconds).toBe(180);
    expect(view.serverNow).toBe("2026-07-24T10:02:00.000Z");
  });
});

describe(`${FEATURE} session reuse + monotonic countdown`, () => {
  it("reuses only when used_attempts_at_start matches current used count", () => {
    expect(
      shouldReuseTimedSession({ used_attempts_at_start: 0 }, 0)
    ).toBe(true);
    expect(
      shouldReuseTimedSession({ used_attempts_at_start: 1 }, 1)
    ).toBe(true);
    expect(
      shouldReuseTimedSession({ used_attempts_at_start: 0 }, 1)
    ).toBe(false);
    expect(shouldReuseTimedSession(null, 0)).toBe(false);
    // Legacy rows without stamp default to attempt 0
    expect(shouldReuseTimedSession({}, 0)).toBe(true);
    expect(shouldReuseTimedSession({}, 1)).toBe(false);
  });

  it("monotonic remaining ignores wall-clock jumps after hydrate", () => {
    expect(
      remainingSecondsMonotonic({
        serverRemainingSeconds: 120,
        hydratedAtPerfMs: 1_000,
        nowPerfMs: 1_000,
      })
    ).toBe(120);
    expect(
      remainingSecondsMonotonic({
        serverRemainingSeconds: 120,
        hydratedAtPerfMs: 1_000,
        nowPerfMs: 31_000,
      })
    ).toBe(90);
    expect(
      remainingSecondsMonotonic({
        serverRemainingSeconds: 10,
        hydratedAtPerfMs: 0,
        nowPerfMs: 20_000,
      })
    ).toBe(0);
  });
});

describe(`${FEATURE} expiry contracts`, () => {
  it("blocks answer mutations after deadline", () => {
    expect(assertTimedSessionAllowsMutation(0)).toEqual({
      ok: false,
      error: expect.stringContaining("انتهى الوقت"),
    });
    expect(assertTimedSessionAllowsMutation(1)).toEqual({ ok: true });
  });

  it("pads missing answers for timed auto-submit", () => {
    expect(
      padAnswersForQuestions(["a", "b", "c"], { a: "1", c: "3" })
    ).toEqual({ a: "1", b: "", c: "3" });
  });

  it("past-deadline remaining is zero (submit still allowed by server)", () => {
    const started = new Date("2026-07-24T09:00:00.000Z");
    const now = new Date("2026-07-24T12:00:00.000Z");
    expect(computeRemainingSeconds(started, 30, now)).toBe(0);
    // Server submit path must not reject solely for remaining === 0
    expect(assertTimedSessionAllowsMutation(0).ok).toBe(false);
  });
});
